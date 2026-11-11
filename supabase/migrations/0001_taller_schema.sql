-- =============================================================================
--  SISTEMA DE GESTIÓN DE TALLER MECÁNICO — Esquema Supabase / PostgreSQL
--  Cubre CU-01..CU-15, RF01..RF36, RNF01..RNF14
--  Ejecutar completo en: Supabase → SQL Editor (o como migración con supabase db push)
--  Moneda: CLP. Zona horaria recomendada del proyecto: America/Santiago
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 0. Extensiones y esquemas
-- -----------------------------------------------------------------------------
create extension if not exists pg_trgm with schema extensions;      -- RNF05 búsquedas rápidas

create schema if not exists privado;                                 -- funciones internas (no expuestas por la API)
revoke all on schema privado from public;
grant usage on schema privado to authenticated;

-- -----------------------------------------------------------------------------
-- 1. Tipos enumerados
-- -----------------------------------------------------------------------------
create type public.rol_usuario         as enum ('admin', 'recepcionista', 'mecanico');
create type public.estado_orden        as enum (
  'por_asignar',            -- CU-02  (RNF03: Ingresado)
  'por_diagnosticar',       -- CU-04  (RNF03: Diagnóstico)
  'diagnosticado',          -- CU-05  "Diagnosticado / Esperando Presupuesto"
  'esperando_aprobacion',   -- CU-09  "Esperando Aprobación de Cliente"
  'presupuesto_aprobado',   -- CU-14
  'presupuesto_rechazado',  -- CU-14 FA
  'esperando_repuesto',     -- CU-06 FA (RNF03: Esperando repuesto)
  'en_reparacion',          -- CU-07  (RNF03: En reparación)
  'pruebas_ruta',           -- CU-07
  'trabajo_terminado',      -- CU-07
  'listo_entrega',          -- CU-03  (RNF03: Listo)
  'pagado_cerrado',         -- CU-11  (RNF03: Entregado)
  'cancelada'
);
create type public.nivel_combustible   as enum ('reserva', '1/4', '1/2', '3/4', 'lleno');
create type public.tipo_foto           as enum ('ingreso', 'diagnostico', 'reparacion', 'entrega');
create type public.tipo_movimiento     as enum ('inicial', 'entrada', 'salida_orden', 'devolucion_orden', 'ajuste_positivo', 'ajuste_negativo');
create type public.estado_solicitud    as enum ('pendiente', 'aprobada', 'comprada', 'recibida', 'cancelada');
create type public.estado_presupuesto  as enum ('borrador', 'publicado', 'aprobado', 'rechazado', 'anulado');
create type public.tipo_item_presupuesto as enum ('repuesto', 'mano_obra', 'otro');
create type public.metodo_pago         as enum ('efectivo', 'tarjeta_debito', 'tarjeta_credito', 'transferencia');
create type public.tipo_notificacion   as enum ('orden_asignada', 'diagnostico_listo', 'repuesto_solicitado', 'presupuesto_publicado',
                                                'presupuesto_aprobado', 'presupuesto_rechazado', 'trabajo_terminado', 'vehiculo_listo', 'otro');
create type public.canal_notificacion  as enum ('sistema', 'email', 'whatsapp', 'sms', 'llamada');
create type public.estado_notificacion as enum ('pendiente', 'enviada', 'fallida');

-- -----------------------------------------------------------------------------
-- 2. Funciones utilitarias puras
-- -----------------------------------------------------------------------------
-- Valida RUT chileno con dígito verificador (formato almacenado: 12345678-9)
create or replace function privado.rut_valido(p_rut text)
returns boolean language plpgsql immutable set search_path = '' as $$
declare
  v_cuerpo text; v_dv text; v_suma int := 0; v_mult int := 2; v_res int; v_esperado text; i int;
begin
  if p_rut is null or p_rut !~ '^[0-9]{7,8}-[0-9K]$' then return false; end if;
  v_cuerpo := split_part(p_rut, '-', 1);
  v_dv     := split_part(p_rut, '-', 2);
  for i in reverse length(v_cuerpo)..1 loop
    v_suma := v_suma + substr(v_cuerpo, i, 1)::int * v_mult;
    v_mult := case when v_mult = 7 then 2 else v_mult + 1 end;
  end loop;
  v_res := 11 - (v_suma % 11);
  v_esperado := case v_res when 11 then '0' when 10 then 'K' else v_res::text end;
  return v_dv = v_esperado;
end $$;

create or replace function privado.normalizar_rut(p_rut text)
returns text language sql immutable set search_path = '' as $$
  select case when p_rut is null then null else
    regexp_replace(upper(regexp_replace(p_rut, '[^0-9kK]', '', 'g')), '^([0-9]+)([0-9K])$', '\1-\2') end
$$;

create or replace function privado.normalizar_patente(p text)
returns text language sql immutable set search_path = '' as $$
  select upper(regexp_replace(coalesce(p, ''), '[^A-Za-z0-9]', '', 'g'))
$$;

-- Etiqueta visible del estado (CU-03, CU-07, CU-13)
create or replace function public.etiqueta_estado(e public.estado_orden)
returns text language sql immutable set search_path = '' as $$
  select case e
    when 'por_asignar'           then 'Por Asignar'
    when 'por_diagnosticar'      then 'Por Diagnosticar'
    when 'diagnosticado'         then 'Diagnosticado / Esperando Presupuesto'
    when 'esperando_aprobacion'  then 'Esperando Aprobación de Cliente'
    when 'presupuesto_aprobado'  then 'Presupuesto Aprobado'
    when 'presupuesto_rechazado' then 'Presupuesto Rechazado'
    when 'esperando_repuesto'    then 'Esperando Repuesto'
    when 'en_reparacion'         then 'En Reparación'
    when 'pruebas_ruta'          then 'Pruebas de Ruta'
    when 'trabajo_terminado'     then 'Trabajo Terminado'
    when 'listo_entrega'         then 'Listo para Entrega'
    when 'pagado_cerrado'        then 'Pagado y Cerrado'
    when 'cancelada'             then 'Cancelada'
  end
$$;

-- Etapa estandarizada RNF03: Ingresado → Diagnóstico → Esperando repuesto → En reparación → Listo → Entregado
create or replace function public.etapa_rnf03(e public.estado_orden)
returns text language sql immutable set search_path = '' as $$
  select case
    when e = 'por_asignar' then 'Ingresado'
    when e in ('por_diagnosticar','diagnosticado','esperando_aprobacion','presupuesto_rechazado') then 'Diagnóstico'
    when e = 'esperando_repuesto' then 'Esperando repuesto'
    when e in ('presupuesto_aprobado','en_reparacion','pruebas_ruta') then 'En reparación'
    when e in ('trabajo_terminado','listo_entrega') then 'Listo'
    when e = 'pagado_cerrado' then 'Entregado'
    else 'Cancelada'
  end
$$;

create sequence public.seq_codigo_orden;

-- RF07: código correlativo único  OT-2026-000001
create or replace function privado.generar_codigo_orden()
returns text language sql volatile security definer set search_path = '' as $$
  select 'OT-' || to_char(now() at time zone 'America/Santiago', 'YYYY') || '-' ||
         lpad(nextval('public.seq_codigo_orden')::text, 6, '0')
$$;

-- CU-13: código de seguimiento no adivinable (10 caracteres hex)
create or replace function privado.generar_codigo_seguimiento()
returns text language sql volatile set search_path = '' as $$
  select upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10))
$$;

create or replace function privado.fn_set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at := now(); return new; end $$;

-- -----------------------------------------------------------------------------
-- 3. Tablas
-- -----------------------------------------------------------------------------

-- 3.1 Usuarios internos (CU-08, RF20-RF22, RNF09). Contraseña: la gestiona Supabase Auth (bcrypt)
create table public.perfiles (
  id               uuid primary key references auth.users(id) on delete cascade,
  nombre_completo  text not null check (length(trim(nombre_completo)) > 0),
  correo           text not null unique,
  telefono         text,
  rol              public.rol_usuario not null,
  activo           boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- 3.2 Clientes (CU-01, RF01)
create table public.clientes (
  id            uuid primary key default gen_random_uuid(),
  rut           text not null unique check (privado.rut_valido(rut)),
  nombre        text not null check (length(trim(nombre)) > 0),
  telefono      text not null,
  correo        text check (correo is null or correo ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  auth_user_id  uuid unique references auth.users(id) on delete set null,   -- cuenta opcional del portal
  created_by    uuid references public.perfiles(id) default auth.uid(),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- 3.3 Vehículos (CU-01, RF02, RF03)
create table public.vehiculos (
  id          uuid primary key default gen_random_uuid(),
  patente     text not null unique check (patente ~ '^[A-Z0-9]{5,8}$'),
  cliente_id  uuid not null references public.clientes(id) on delete restrict,
  marca       text not null,
  modelo      text not null,
  anio        smallint not null check (anio between 1950 and 2100),
  color       text,
  vin         text unique,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- 3.4 Órdenes de trabajo (CU-02..CU-07, CU-11, CU-13; RF04, RF05, RF07)
create table public.ordenes_trabajo (
  id                    uuid primary key default gen_random_uuid(),
  codigo                text not null unique default privado.generar_codigo_orden(),
  codigo_seguimiento    text not null unique default privado.generar_codigo_seguimiento(),
  vehiculo_id           uuid not null references public.vehiculos(id) on delete restrict,
  cliente_id            uuid not null references public.clientes(id) on delete restrict,  -- dueño al momento del ingreso
  recepcionista_id      uuid references public.perfiles(id) default auth.uid(),
  mecanico_id           uuid references public.perfiles(id),
  estado                public.estado_orden not null default 'por_asignar',
  kilometraje           integer not null check (kilometraje >= 0),
  nivel_combustible     public.nivel_combustible not null,
  motivo_ingreso        text not null check (length(trim(motivo_ingreso)) > 0),
  observaciones_ingreso text,
  avance_pct            smallint not null default 0 check (avance_pct between 0 and 100),
  observaciones_finales text,
  fecha_ingreso         timestamptz not null default now(),
  fecha_termino         timestamptz,
  fecha_entrega         timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
-- Un vehículo solo puede tener una orden abierta a la vez
create unique index ux_orden_abierta_por_vehiculo on public.ordenes_trabajo(vehiculo_id)
  where estado not in ('pagado_cerrado', 'cancelada');

-- 3.5 Fotografías (RF06, RF11, RNF07). El archivo vive en Storage: bucket fotos-ordenes/{orden_id}/...
create table public.fotos_orden (
  id            uuid primary key default gen_random_uuid(),
  orden_id      uuid not null references public.ordenes_trabajo(id) on delete cascade,
  storage_path  text not null unique,
  tipo          public.tipo_foto not null default 'ingreso',
  descripcion   text,
  subido_por    uuid references public.perfiles(id) default auth.uid(),
  created_at    timestamptz not null default now()
);

-- 3.6 Diagnóstico técnico (CU-05, RF12)
create table public.diagnosticos (
  id           uuid primary key default gen_random_uuid(),
  orden_id     uuid not null references public.ordenes_trabajo(id) on delete cascade,
  mecanico_id  uuid not null references public.perfiles(id) default auth.uid(),
  descripcion  text not null check (length(trim(descripcion)) > 0),     -- CU-05 FA1
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- 3.7 Catálogo de tareas para el checklist (CU-05)
create table public.catalogo_tareas (
  id                    uuid primary key default gen_random_uuid(),
  nombre                text not null unique,
  descripcion           text,
  valor_mano_obra_ref   numeric(14,2) check (valor_mano_obra_ref >= 0),
  activo                boolean not null default true
);

-- 3.8 Tareas recomendadas/ejecutadas en la orden (CU-05, CU-15)
create table public.orden_tareas (
  id              uuid primary key default gen_random_uuid(),
  orden_id        uuid not null references public.ordenes_trabajo(id) on delete cascade,
  diagnostico_id  uuid references public.diagnosticos(id) on delete set null,
  tarea_id        uuid references public.catalogo_tareas(id) on delete set null,
  descripcion     text not null,
  completada      boolean not null default false,
  completada_en   timestamptz,
  created_at      timestamptz not null default now()
);

-- 3.9 Inventario (CU-06, CU-10; RF15, RF27, RF28)
create table public.categorias_repuesto (
  id      smallint generated always as identity primary key,
  nombre  text not null unique
);

create table public.repuestos (
  id              uuid primary key default gen_random_uuid(),
  codigo          text not null unique,
  nombre          text not null,
  categoria_id    smallint references public.categorias_repuesto(id),
  stock           integer not null default 0 check (stock >= 0),
  stock_minimo    integer not null default 0 check (stock_minimo >= 0),
  costo_promedio  numeric(14,2) not null default 0 check (costo_promedio >= 0),
  precio_venta    numeric(14,2) not null check (precio_venta >= 0),
  activo          boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Kárdex: cada cambio de stock queda registrado (RF16, RF28)
create table public.movimientos_inventario (
  id                         bigint generated always as identity primary key,
  repuesto_id                uuid not null references public.repuestos(id) on delete restrict,
  tipo                       public.tipo_movimiento not null,
  cantidad                   integer not null check (cantidad > 0),
  costo_unitario             numeric(14,2) not null default 0 check (costo_unitario >= 0),
  stock_resultante           integer,
  costo_promedio_resultante  numeric(14,2),
  orden_id                   uuid references public.ordenes_trabajo(id) on delete set null,
  solicitud_id               uuid,
  motivo                     text,
  usuario_id                 uuid references public.perfiles(id) default auth.uid(),
  created_at                 timestamptz not null default now()
);

-- Repuestos asignados a la orden (CU-06, RF16)
create table public.orden_repuestos (
  id              uuid primary key default gen_random_uuid(),
  orden_id        uuid not null references public.ordenes_trabajo(id) on delete cascade,
  repuesto_id     uuid not null references public.repuestos(id) on delete restrict,
  cantidad        integer not null check (cantidad > 0),
  costo_unitario  numeric(14,2) not null default 0,   -- snapshot del costo promedio
  precio_unitario numeric(14,2) not null default 0,   -- snapshot del precio de venta
  agregado_por    uuid references public.perfiles(id) default auth.uid(),
  created_at      timestamptz not null default now(),
  unique (orden_id, repuesto_id)
);

-- Requerimientos de compra (CU-06 FA, RF17)
create table public.solicitudes_compra (
  id                    uuid primary key default gen_random_uuid(),
  orden_id              uuid references public.ordenes_trabajo(id) on delete set null,
  repuesto_id           uuid references public.repuestos(id) on delete set null,
  descripcion_repuesto  text,
  cantidad              integer not null check (cantidad > 0),
  estado                public.estado_solicitud not null default 'pendiente',
  solicitado_por        uuid references public.perfiles(id) default auth.uid(),
  atendido_por          uuid references public.perfiles(id),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  check (repuesto_id is not null or descripcion_repuesto is not null)
);
alter table public.movimientos_inventario
  add constraint fk_mov_solicitud foreign key (solicitud_id) references public.solicitudes_compra(id) on delete set null;

-- 3.10 Presupuesto (CU-09, CU-14; RF23-RF26, RF33, RF35)
create table public.presupuestos (
  id               uuid primary key default gen_random_uuid(),
  orden_id         uuid not null references public.ordenes_trabajo(id) on delete cascade,
  version          smallint not null default 1,
  estado           public.estado_presupuesto not null default 'borrador',
  total_repuestos  numeric(14,2) not null default 0,
  total_mano_obra  numeric(14,2) not null default 0,
  total_otros      numeric(14,2) not null default 0,
  costo_interno    numeric(14,2) not null default 0,
  descuento        numeric(14,2) not null default 0 check (descuento >= 0),
  total            numeric(14,2) generated always as (total_repuestos + total_mano_obra + total_otros - descuento) stored,
  margen           numeric(14,2) generated always as (total_repuestos + total_mano_obra + total_otros - descuento - costo_interno) stored,
  notas            text,
  creado_por       uuid references public.perfiles(id) default auth.uid(),
  publicado_en     timestamptz,
  respondido_en    timestamptz,
  respuesta_via    text check (respuesta_via in ('portal', 'telefono', 'presencial')),
  motivo_rechazo   text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (orden_id, version),
  check (descuento <= total_repuestos + total_mano_obra + total_otros),
  check (estado <> 'rechazado' or length(trim(coalesce(motivo_rechazo, ''))) > 0)   -- RF35
);
create unique index ux_presupuesto_vigente on public.presupuestos(orden_id)
  where estado in ('borrador', 'publicado', 'aprobado');

create table public.presupuesto_items (
  id               uuid primary key default gen_random_uuid(),
  presupuesto_id   uuid not null references public.presupuestos(id) on delete cascade,
  tipo             public.tipo_item_presupuesto not null,
  repuesto_id      uuid references public.repuestos(id) on delete set null,
  descripcion      text not null,
  cantidad         numeric(10,2) not null default 1 check (cantidad > 0),
  costo_unitario   numeric(14,2) not null default 0 check (costo_unitario >= 0),
  precio_unitario  numeric(14,2) not null check (precio_unitario >= 0),     -- RF24 editable
  subtotal         numeric(14,2) generated always as (round(cantidad * precio_unitario, 2)) stored,
  orden_visual     smallint not null default 0,
  check (tipo <> 'repuesto' or repuesto_id is not null)
);

-- 3.11 Pagos y abonos (CU-11; RF29, RF30)
create table public.pagos (
  id                uuid primary key default gen_random_uuid(),
  orden_id          uuid not null references public.ordenes_trabajo(id) on delete restrict,
  presupuesto_id    uuid references public.presupuestos(id),
  monto             numeric(14,2) not null check (monto > 0),
  monto_recibido    numeric(14,2),
  metodo            public.metodo_pago not null,
  numero_operacion  text,
  es_abono          boolean not null default false,
  anulado           boolean not null default false,
  motivo_anulacion  text,
  registrado_por    uuid references public.perfiles(id) default auth.uid(),
  created_at        timestamptz not null default now(),
  check (monto_recibido is null or monto_recibido >= monto),
  check (metodo = 'efectivo' or numero_operacion is not null),
  check (not anulado or motivo_anulacion is not null)
);

-- 3.12 Notificaciones internas y al cliente (RF08, RF09, RF14, RF19, RF34)
create table public.notificaciones (
  id                       uuid primary key default gen_random_uuid(),
  orden_id                 uuid references public.ordenes_trabajo(id) on delete cascade,
  tipo                     public.tipo_notificacion not null,
  canal                    public.canal_notificacion not null default 'sistema',
  destinatario_cliente_id  uuid references public.clientes(id) on delete cascade,
  destinatario_usuario_id  uuid references public.perfiles(id) on delete cascade,
  destinatario_rol         public.rol_usuario,
  mensaje                  text not null,
  estado                   public.estado_notificacion not null default 'pendiente',
  error_detalle            text,
  enviada_en               timestamptz,
  leida_en                 timestamptz,
  creado_por               uuid references public.perfiles(id) default auth.uid(),
  created_at               timestamptz not null default now(),
  check (num_nonnulls(destinatario_cliente_id, destinatario_usuario_id, destinatario_rol) >= 1)
);

-- 3.13 Bitácoras de la orden (CU-07, RNF03, RNF12)
create table public.historial_estados (
  id               bigint generated always as identity primary key,
  orden_id         uuid not null references public.ordenes_trabajo(id) on delete cascade,
  estado_anterior  public.estado_orden,
  estado_nuevo     public.estado_orden not null,
  actor_rol        text not null,
  usuario_id       uuid references auth.users(id),
  nota             text,
  created_at       timestamptz not null default now()
);

create table public.avances_orden (
  id                uuid primary key default gen_random_uuid(),
  orden_id          uuid not null references public.ordenes_trabajo(id) on delete cascade,
  mecanico_id       uuid not null references public.perfiles(id) default auth.uid(),
  porcentaje        smallint check (porcentaje between 0 and 100),
  nota              text not null check (length(trim(nota)) > 0),
  created_at        timestamptz not null default now()
);

-- 3.14 Auditoría (RNF12): fecha, hora y usuario de cualquier modificación
create table public.auditoria (
  id             bigint generated always as identity primary key,
  tabla          text not null,
  registro_id    text,
  orden_id       uuid,
  accion         text not null check (accion in ('INSERT', 'UPDATE', 'DELETE')),
  datos_antes    jsonb,
  datos_despues  jsonb,
  usuario_id     uuid,
  rol            text,
  created_at     timestamptz not null default now()
);

-- 3.15 Reglas de la máquina de estados (catálogo)
create table public.transiciones_estado (
  origen   public.estado_orden not null,
  destino  public.estado_orden not null,
  roles    text[] not null,          -- admin | recepcionista | mecanico | cliente | sistema
  primary key (origen, destino)
);

-- -----------------------------------------------------------------------------
-- 4. Índices (RNF05: búsquedas < 2 s; RNF06: concurrencia)
-- -----------------------------------------------------------------------------
create index ix_clientes_nombre_trgm   on public.clientes  using gin (nombre extensions.gin_trgm_ops);
create index ix_vehiculos_patente_trgm on public.vehiculos using gin (patente extensions.gin_trgm_ops);
create index ix_vehiculos_modelo_trgm  on public.vehiculos using gin ((marca || ' ' || modelo) extensions.gin_trgm_ops);
create index ix_repuestos_nombre_trgm  on public.repuestos using gin (nombre extensions.gin_trgm_ops);
create index ix_vehiculos_cliente      on public.vehiculos(cliente_id);
create index ix_clientes_auth          on public.clientes(auth_user_id);
create index ix_ordenes_estado         on public.ordenes_trabajo(estado);
create index ix_ordenes_mecanico       on public.ordenes_trabajo(mecanico_id, estado);
create index ix_ordenes_cliente        on public.ordenes_trabajo(cliente_id);
create index ix_ordenes_vehiculo       on public.ordenes_trabajo(vehiculo_id, fecha_ingreso desc);
create index ix_ordenes_fecha          on public.ordenes_trabajo(fecha_ingreso);
create index ix_fotos_orden            on public.fotos_orden(orden_id);
create index ix_diag_orden             on public.diagnosticos(orden_id);
create index ix_tareas_orden           on public.orden_tareas(orden_id);
create index ix_or_orden               on public.orden_repuestos(orden_id);
create index ix_mov_repuesto_fecha     on public.movimientos_inventario(repuesto_id, created_at);
create index ix_mov_orden              on public.movimientos_inventario(orden_id);
create index ix_sol_estado             on public.solicitudes_compra(estado);
create index ix_pres_orden             on public.presupuestos(orden_id);
create index ix_items_pres             on public.presupuesto_items(presupuesto_id);
create index ix_pagos_orden            on public.pagos(orden_id);
create index ix_pagos_fecha            on public.pagos(created_at);
create index ix_notif_usuario          on public.notificaciones(destinatario_usuario_id, leida_en);
create index ix_notif_rol              on public.notificaciones(destinatario_rol, leida_en);
create index ix_notif_orden            on public.notificaciones(orden_id);
create index ix_hist_orden             on public.historial_estados(orden_id, created_at);
create index ix_avances_orden          on public.avances_orden(orden_id, created_at);
create index ix_auditoria_orden        on public.auditoria(orden_id, created_at);
create index ix_auditoria_tabla        on public.auditoria(tabla, created_at);

-- -----------------------------------------------------------------------------
-- 5. Funciones de seguridad para RLS (SECURITY DEFINER, sin recursión de políticas)
-- -----------------------------------------------------------------------------
create or replace function privado.rol_actual()
returns public.rol_usuario language sql stable security definer set search_path = '' as $$
  select p.rol from public.perfiles p where p.id = auth.uid() and p.activo
$$;

create or replace function privado.es_staff()
returns boolean language sql stable security definer set search_path = '' as $$
  select privado.rol_actual() is not null
$$;

create or replace function privado.cliente_actual()
returns uuid language sql stable security definer set search_path = '' as $$
  select c.id from public.clientes c where c.auth_user_id = auth.uid()
$$;

create or replace function privado.es_mecanico_de(p_orden uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select privado.rol_actual() = 'mecanico'
     and exists (select 1 from public.ordenes_trabajo o where o.id = p_orden and o.mecanico_id = auth.uid())
$$;

create or replace function privado.puede_ver_orden(p_orden uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select case privado.rol_actual()
    when 'admin' then true
    when 'recepcionista' then true
    when 'mecanico' then exists (select 1 from public.ordenes_trabajo o
                                 where o.id = p_orden and (o.mecanico_id = auth.uid() or o.estado = 'por_asignar'))
    else exists (select 1 from public.ordenes_trabajo o
                 where o.id = p_orden and o.cliente_id = privado.cliente_actual())
  end
$$;

-- Saldo pendiente = total del presupuesto aprobado − pagos válidos (RF30)
create or replace function privado.saldo_orden(p_orden uuid)
returns numeric language sql stable security definer set search_path = '' as $$
  select coalesce((select p.total from public.presupuestos p
                   where p.orden_id = p_orden and p.estado = 'aprobado'), 0)
       - coalesce((select sum(g.monto) from public.pagos g
                   where g.orden_id = p_orden and not g.anulado), 0)
$$;

revoke all on all functions in schema privado from public;
grant execute on function privado.rol_actual(), privado.es_staff(), privado.cliente_actual(),
                          privado.es_mecanico_de(uuid), privado.puede_ver_orden(uuid),
                          privado.rut_valido(text), privado.normalizar_rut(text), privado.normalizar_patente(text),
                          privado.generar_codigo_orden(), privado.generar_codigo_seguimiento()
  to authenticated;

-- -----------------------------------------------------------------------------
-- 6. Motor de estados y notificaciones
-- -----------------------------------------------------------------------------
create or replace function privado.notificar(p_orden uuid, p_tipo public.tipo_notificacion, p_mensaje text,
                                             p_rol public.rol_usuario default null, p_usuario uuid default null,
                                             p_cliente uuid default null, p_canal public.canal_notificacion default 'sistema')
returns void language sql security definer set search_path = '' as $$
  insert into public.notificaciones (orden_id, tipo, canal, destinatario_rol, destinatario_usuario_id, destinatario_cliente_id, mensaje,
                                     estado, enviada_en, creado_por)
  values (p_orden, p_tipo, p_canal, p_rol, p_usuario, p_cliente, p_mensaje,
          case when p_canal = 'sistema' then 'enviada'::public.estado_notificacion else 'pendiente' end,
          case when p_canal = 'sistema' then now() end,
          (select id from public.perfiles where id = auth.uid()))
$$;

create or replace function privado.transicionar_orden(p_orden uuid, p_destino public.estado_orden, p_actor text, p_nota text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare
  o public.ordenes_trabajo%rowtype;
begin
  select * into o from public.ordenes_trabajo where id = p_orden for update;
  if not found then raise exception 'Orden % no existe', p_orden using errcode = 'P0002'; end if;
  if o.estado = p_destino then return; end if;

  if not exists (select 1 from public.transiciones_estado t
                 where t.origen = o.estado and t.destino = p_destino and p_actor = any(t.roles)) then
    raise exception 'Transición no permitida: % → % (rol %)',
      public.etiqueta_estado(o.estado), public.etiqueta_estado(p_destino), p_actor using errcode = 'P0001';
  end if;

  if p_destino = 'pagado_cerrado' and privado.saldo_orden(p_orden) > 0 then
    raise exception 'La orden tiene saldo pendiente de %', privado.saldo_orden(p_orden) using errcode = 'P0001';
  end if;

  update public.ordenes_trabajo set
    estado        = p_destino,
    fecha_termino = case when p_destino = 'trabajo_terminado' then now() else fecha_termino end,
    fecha_entrega = case when p_destino in ('pagado_cerrado') then now() else fecha_entrega end,
    avance_pct    = case when p_destino = 'trabajo_terminado' then 100 else avance_pct end
  where id = p_orden;

  insert into public.historial_estados (orden_id, estado_anterior, estado_nuevo, actor_rol, usuario_id, nota)
  values (p_orden, o.estado, p_destino, p_actor, auth.uid(), p_nota);

  -- Notificaciones automáticas
  case p_destino
    when 'por_diagnosticar' then
      perform privado.notificar(p_orden, 'orden_asignada', 'Se te asignó la orden ' || o.codigo, null, o.mecanico_id);
    when 'diagnosticado' then                                                                         -- RF14
      perform privado.notificar(p_orden, 'diagnostico_listo', 'La orden ' || o.codigo || ' tiene evaluación técnica', 'admin');
    when 'esperando_repuesto' then
      perform privado.notificar(p_orden, 'repuesto_solicitado', 'La orden ' || o.codigo || ' espera repuestos', 'admin');
    when 'esperando_aprobacion' then                                                                  -- RF26
      perform privado.notificar(p_orden, 'presupuesto_publicado', 'Su presupuesto de la orden ' || o.codigo || ' está disponible',
                                null, null, o.cliente_id, 'email');
    when 'presupuesto_aprobado' then                                                                  -- RF34
      perform privado.notificar(p_orden, 'presupuesto_aprobado', 'Cliente aprobó el presupuesto de ' || o.codigo, 'admin');
      if o.mecanico_id is not null then
        perform privado.notificar(p_orden, 'presupuesto_aprobado', 'Puedes iniciar la reparación de ' || o.codigo, null, o.mecanico_id);
      end if;
    when 'presupuesto_rechazado' then
      perform privado.notificar(p_orden, 'presupuesto_rechazado', 'Cliente rechazó el presupuesto de ' || o.codigo, 'admin');
    when 'trabajo_terminado' then                                                                     -- RF19
      perform privado.notificar(p_orden, 'trabajo_terminado', 'Trabajo terminado en ' || o.codigo || ': avisar al cliente', 'recepcionista');
    else null;
  end case;
end $$;

-- -----------------------------------------------------------------------------
-- 7. Triggers de negocio
-- -----------------------------------------------------------------------------

-- 7.1 Normalización de RUT y patente (RF03: búsqueda exacta y sin duplicados)
create or replace function privado.fn_normalizar_cliente()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.rut := privado.normalizar_rut(new.rut);
  new.correo := lower(trim(new.correo));
  return new;
end $$;

create or replace function privado.fn_normalizar_vehiculo()
returns trigger language plpgsql set search_path = '' as $$
begin new.patente := privado.normalizar_patente(new.patente); return new; end $$;

-- 7.2 Alta de usuario en Auth → perfil interno o vínculo con cliente
--     El rol se envía en app_metadata (solo escribible con service_role desde la Edge Function del admin)
create or replace function privado.fn_nuevo_usuario_auth()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_rol text := new.raw_app_meta_data ->> 'rol';
begin
  if v_rol in ('admin', 'recepcionista', 'mecanico') then
    insert into public.perfiles (id, nombre_completo, correo, rol)
    values (new.id, coalesce(new.raw_app_meta_data ->> 'nombre', new.email), new.email, v_rol::public.rol_usuario)
    on conflict (id) do nothing;
  elsif new.email_confirmed_at is not null then
    update public.clientes set auth_user_id = new.id
    where lower(correo) = lower(new.email) and auth_user_id is null;
  end if;
  return new;
end $$;

-- 7.3 Órdenes: valores forzados al crear y columnas protegidas al editar
create or replace function privado.fn_orden_before_insert()
returns trigger language plpgsql set search_path = '' as $$
begin
  select v.cliente_id into new.cliente_id from public.vehiculos v where v.id = new.vehiculo_id;
  if current_user in ('authenticated', 'anon') then
    new.estado := 'por_asignar';
    new.mecanico_id := null;
    new.recepcionista_id := auth.uid();
    new.codigo := privado.generar_codigo_orden();
    new.codigo_seguimiento := privado.generar_codigo_seguimiento();
    new.avance_pct := 0;
    new.fecha_ingreso := now();
  end if;
  return new;
end $$;

create or replace function privado.fn_orden_after_insert()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.historial_estados (orden_id, estado_anterior, estado_nuevo, actor_rol, usuario_id, nota)
  values (new.id, null, new.estado, coalesce(privado.rol_actual()::text, 'sistema'), auth.uid(), 'Orden creada');
  return new;
end $$;

create or replace function privado.fn_orden_guard_update()
returns trigger language plpgsql set search_path = '' as $$
declare v_rol public.rol_usuario;
begin
  if current_user not in ('authenticated', 'anon') then return new; end if;   -- cambios desde funciones RPC/sistema
  v_rol := privado.rol_actual();
  if old.estado in ('pagado_cerrado', 'cancelada') then
    raise exception 'La orden % está cerrada y no se puede modificar', old.codigo;
  end if;
  if (new.estado, new.mecanico_id, new.codigo, new.codigo_seguimiento, new.vehiculo_id, new.cliente_id,
      new.recepcionista_id, new.fecha_ingreso, new.fecha_termino, new.fecha_entrega)
     is distinct from
     (old.estado, old.mecanico_id, old.codigo, old.codigo_seguimiento, old.vehiculo_id, old.cliente_id,
      old.recepcionista_id, old.fecha_ingreso, old.fecha_termino, old.fecha_entrega) then
    raise exception 'Estado, asignación y fechas solo cambian mediante las funciones cambiar_estado_orden / asignar_mecanico';
  end if;
  if v_rol = 'mecanico' and (new.kilometraje, new.nivel_combustible, new.motivo_ingreso, new.observaciones_ingreso)
       is distinct from (old.kilometraje, old.nivel_combustible, old.motivo_ingreso, old.observaciones_ingreso) then
    raise exception 'El mecánico no puede modificar los datos de ingreso';
  end if;
  if v_rol = 'recepcionista' and (new.avance_pct, new.observaciones_finales)
       is distinct from (old.avance_pct, old.observaciones_finales) then
    raise exception 'El avance y observaciones finales los registra el mecánico';
  end if;
  return new;
end $$;

-- 7.4 Diagnóstico → estado "Diagnosticado / Esperando Presupuesto" + aviso al admin (RF13, RF14)
create or replace function privado.fn_diagnostico_after_insert()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if (select estado from public.ordenes_trabajo where id = new.orden_id) = 'por_diagnosticar' then
    perform privado.transicionar_orden(new.orden_id, 'diagnosticado', 'sistema', 'Diagnóstico registrado');
  end if;
  return new;
end $$;

-- 7.5 Inventario: kárdex que mantiene stock y costo promedio ponderado (RF16, RF28)
create or replace function privado.fn_movimiento_before_insert()
returns trigger language plpgsql security definer set search_path = '' as $$
declare r public.repuestos%rowtype; v_stock int; v_costo numeric(14,2);
begin
  select * into r from public.repuestos where id = new.repuesto_id for update;
  v_stock := r.stock; v_costo := r.costo_promedio;
  case new.tipo
    when 'inicial' then
      null;                                                   -- el stock ya viene en el INSERT del repuesto
    when 'entrada' then
      v_costo := round(((r.stock * r.costo_promedio) + (new.cantidad * new.costo_unitario)) / (r.stock + new.cantidad), 2);
      v_stock := r.stock + new.cantidad;
    when 'ajuste_positivo', 'devolucion_orden' then
      v_stock := r.stock + new.cantidad;
    when 'salida_orden', 'ajuste_negativo' then
      v_stock := r.stock - new.cantidad;
      if v_stock < 0 then
        raise exception 'Stock insuficiente para % (disponible: %, solicitado: %)', r.nombre, r.stock, new.cantidad
          using errcode = 'P0001', hint = 'Use "Solicitar Repuesto Faltante"';
      end if;
  end case;
  if new.tipo <> 'entrada' and new.costo_unitario = 0 then new.costo_unitario := r.costo_promedio; end if;
  update public.repuestos set stock = v_stock, costo_promedio = v_costo where id = r.id;
  new.stock_resultante := v_stock;
  new.costo_promedio_resultante := v_costo;
  return new;
end $$;

create or replace function privado.fn_movimiento_after_insert()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.tipo = 'entrada' and new.solicitud_id is not null then
    update public.solicitudes_compra set estado = 'recibida', atendido_por = auth.uid() where id = new.solicitud_id;
  end if;
  return new;
end $$;

create or replace function privado.fn_repuesto_after_insert()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.stock > 0 then
    insert into public.movimientos_inventario (repuesto_id, tipo, cantidad, costo_unitario, motivo)
    values (new.id, 'inicial', new.stock, new.costo_promedio, 'Stock inicial');
  end if;
  return new;
end $$;

create or replace function privado.fn_repuesto_guard_update()
returns trigger language plpgsql set search_path = '' as $$
begin
  if current_user in ('authenticated', 'anon') and (new.stock, new.costo_promedio) is distinct from (old.stock, old.costo_promedio) then
    raise exception 'Stock y costo promedio se modifican registrando un movimiento de inventario';
  end if;
  return new;
end $$;

-- 7.6 Repuestos en la orden: snapshot de precios y descuento automático de stock (CU-06, RF16)
create or replace function privado.fn_orden_repuesto_before()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_estado public.estado_orden; r public.repuestos%rowtype;
begin
  select estado into v_estado from public.ordenes_trabajo where id = coalesce(new.orden_id, old.orden_id);
  if v_estado not in ('por_diagnosticar', 'diagnosticado', 'presupuesto_aprobado', 'esperando_repuesto', 'en_reparacion', 'pruebas_ruta') then
    raise exception 'No se pueden modificar repuestos con la orden en estado %', public.etiqueta_estado(v_estado);
  end if;
  if tg_op = 'INSERT' then
    select * into r from public.repuestos where id = new.repuesto_id;
    if not r.activo then raise exception 'El repuesto % está inactivo', r.codigo; end if;
    new.costo_unitario := r.costo_promedio;
    new.precio_unitario := r.precio_venta;
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end $$;

create or replace function privado.fn_orden_repuesto_after()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    insert into public.movimientos_inventario (repuesto_id, tipo, cantidad, orden_id, motivo)
    values (new.repuesto_id, 'salida_orden', new.cantidad, new.orden_id, 'Asignado a orden');
  elsif tg_op = 'UPDATE' and new.cantidad <> old.cantidad then
    insert into public.movimientos_inventario (repuesto_id, tipo, cantidad, orden_id, motivo)
    values (new.repuesto_id, case when new.cantidad > old.cantidad then 'salida_orden'::public.tipo_movimiento else 'devolucion_orden' end,
            abs(new.cantidad - old.cantidad), new.orden_id, 'Ajuste de cantidad en orden');
  elsif tg_op = 'DELETE' then
    insert into public.movimientos_inventario (repuesto_id, tipo, cantidad, orden_id, motivo)
    values (old.repuesto_id, 'devolucion_orden', old.cantidad, old.orden_id, 'Quitado de la orden');
  end if;
  return null;
end $$;

-- 7.7 Solicitud de compra → orden "Esperando Repuesto" (CU-06 FA, RF17)
create or replace function privado.fn_solicitud_after_insert()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_estado public.estado_orden;
begin
  if new.orden_id is not null then
    select estado into v_estado from public.ordenes_trabajo where id = new.orden_id;
    if v_estado in ('por_diagnosticar', 'diagnosticado', 'presupuesto_aprobado', 'en_reparacion') then
      perform privado.transicionar_orden(new.orden_id, 'esperando_repuesto', 'sistema', 'Solicitud de compra creada');
    else
      perform privado.notificar(new.orden_id, 'repuesto_solicitado', 'Nueva solicitud de compra de repuesto', 'admin');
    end if;
  else
    perform privado.notificar(null, 'repuesto_solicitado', 'Nueva solicitud de compra de repuesto', 'admin');
  end if;
  return new;
end $$;

-- 7.8 Presupuesto: totales automáticos y edición solo en borrador (RF24, RF25)
create or replace function privado.recalcular_presupuesto(p_id uuid)
returns void language sql security definer set search_path = '' as $$
  update public.presupuestos p set
    total_repuestos = coalesce((select sum(subtotal) from public.presupuesto_items where presupuesto_id = p_id and tipo = 'repuesto'), 0),
    total_mano_obra = coalesce((select sum(subtotal) from public.presupuesto_items where presupuesto_id = p_id and tipo = 'mano_obra'), 0),
    total_otros     = coalesce((select sum(subtotal) from public.presupuesto_items where presupuesto_id = p_id and tipo = 'otro'), 0),
    costo_interno   = coalesce((select sum(round(cantidad * costo_unitario, 2)) from public.presupuesto_items where presupuesto_id = p_id), 0)
  where p.id = p_id
$$;

create or replace function privado.fn_item_guard()
returns trigger language plpgsql set search_path = '' as $$
declare v_estado public.estado_presupuesto;
begin
  if current_user in ('authenticated', 'anon') then
    select estado into v_estado from public.presupuestos where id = coalesce(new.presupuesto_id, old.presupuesto_id);
    if v_estado <> 'borrador' then raise exception 'Solo se editan presupuestos en borrador'; end if;
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end $$;

create or replace function privado.fn_item_after()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  perform privado.recalcular_presupuesto(coalesce(new.presupuesto_id, old.presupuesto_id));
  return null;
end $$;

create or replace function privado.fn_presupuesto_guard()
returns trigger language plpgsql set search_path = '' as $$
begin
  if current_user not in ('authenticated', 'anon') then return new; end if;
  if tg_op = 'INSERT' then
    raise exception 'Use la función generar_presupuesto()';
  end if;
  if old.estado <> 'borrador' then raise exception 'El presupuesto ya fue publicado; genere una nueva versión'; end if;
  if (new.estado, new.orden_id, new.version, new.total_repuestos, new.total_mano_obra, new.total_otros, new.costo_interno,
      new.publicado_en, new.respondido_en, new.motivo_rechazo, new.respuesta_via)
     is distinct from
     (old.estado, old.orden_id, old.version, old.total_repuestos, old.total_mano_obra, old.total_otros, old.costo_interno,
      old.publicado_en, old.respondido_en, old.motivo_rechazo, old.respuesta_via) then
    raise exception 'Solo se pueden editar descuento y notas; use las funciones de publicación/respuesta';
  end if;
  return new;
end $$;

-- 7.9 Pagos: validación de saldo, abonos y cierre automático (RF29, RF30)
create or replace function privado.fn_pago_before_insert()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_estado public.estado_orden; v_saldo numeric;
begin
  select estado into v_estado from public.ordenes_trabajo where id = new.orden_id for update;
  if v_estado not in ('presupuesto_aprobado', 'esperando_repuesto', 'en_reparacion', 'pruebas_ruta', 'trabajo_terminado', 'listo_entrega') then
    raise exception 'No se registran pagos con la orden en estado %', public.etiqueta_estado(v_estado);
  end if;
  v_saldo := privado.saldo_orden(new.orden_id);
  if new.monto > v_saldo then
    raise exception 'El monto (%) supera el saldo pendiente (%)', new.monto, v_saldo using errcode = 'P0001';
  end if;
  select id into new.presupuesto_id from public.presupuestos where orden_id = new.orden_id and estado = 'aprobado';
  new.es_abono := new.monto < v_saldo;
  new.anulado := false;
  return new;
end $$;

create or replace function privado.fn_pago_after_insert()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if privado.saldo_orden(new.orden_id) <= 0
     and (select estado from public.ordenes_trabajo where id = new.orden_id) = 'listo_entrega' then
    perform privado.transicionar_orden(new.orden_id, 'pagado_cerrado', 'sistema', 'Pago total registrado');
  end if;
  return new;
end $$;

create or replace function privado.fn_pago_guard_update()
returns trigger language plpgsql set search_path = '' as $$
begin
  if current_user in ('authenticated', 'anon') and
     (new.orden_id, new.presupuesto_id, new.monto, new.metodo, new.numero_operacion, new.es_abono, new.created_at)
     is distinct from (old.orden_id, old.presupuesto_id, old.monto, old.metodo, old.numero_operacion, old.es_abono, old.created_at) then
    raise exception 'Un pago no se edita: anúlelo y registre uno nuevo';
  end if;
  if old.anulado and not new.anulado then raise exception 'Un pago anulado no se reactiva'; end if;
  return new;
end $$;

-- 7.10 Notificación al cliente enviada (automática o por llamada) → "Listo para Entrega" (CU-03, RF08, RF09)
create or replace function privado.fn_notificacion_after()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.tipo = 'vehiculo_listo' and new.estado = 'enviada' and new.orden_id is not null
     and (select estado from public.ordenes_trabajo where id = new.orden_id) = 'trabajo_terminado' then
    perform privado.transicionar_orden(new.orden_id, 'listo_entrega', 'sistema',
      case when new.canal = 'llamada' then 'Notificado por llamada' else 'Notificado por ' || new.canal end);
  end if;
  return new;
end $$;

create or replace function privado.fn_notificacion_before()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.estado = 'enviada' and new.enviada_en is null then new.enviada_en := now(); end if;
  return new;
end $$;

-- 7.11 Avance diario → actualiza % de la orden (CU-07 FA)
create or replace function privado.fn_avance_after_insert()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.porcentaje is not null then
    update public.ordenes_trabajo set avance_pct = new.porcentaje where id = new.orden_id;
  end if;
  return new;
end $$;

-- 7.12 Auditoría genérica (RNF12)
create or replace function privado.fn_auditoria()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_old jsonb; v_new jsonb; v_row jsonb; v_orden uuid;
begin
  if tg_op in ('UPDATE', 'DELETE') then v_old := to_jsonb(old); end if;
  if tg_op in ('INSERT', 'UPDATE') then v_new := to_jsonb(new); end if;
  if tg_op = 'UPDATE' and (v_old - 'updated_at') = (v_new - 'updated_at') then return null; end if;
  v_row := coalesce(v_new, v_old);
  v_orden := case
    when tg_table_name = 'ordenes_trabajo' then (v_row ->> 'id')::uuid
    when tg_table_name = 'presupuesto_items' then (select orden_id from public.presupuestos where id = (v_row ->> 'presupuesto_id')::uuid)
    else (v_row ->> 'orden_id')::uuid end;
  insert into public.auditoria (tabla, registro_id, orden_id, accion, datos_antes, datos_despues, usuario_id, rol)
  values (tg_table_name, v_row ->> 'id', v_orden, tg_op, v_old, v_new, auth.uid(),
          coalesce(privado.rol_actual()::text, case when auth.uid() is null then 'sistema' else 'cliente' end));
  return null;
end $$;

-- 7.13 Registro de triggers
create trigger trg_upd_perfiles     before update on public.perfiles        for each row execute function privado.fn_set_updated_at();
create trigger trg_upd_clientes     before update on public.clientes        for each row execute function privado.fn_set_updated_at();
create trigger trg_upd_vehiculos    before update on public.vehiculos       for each row execute function privado.fn_set_updated_at();
create trigger trg_upd_ordenes      before update on public.ordenes_trabajo for each row execute function privado.fn_set_updated_at();
create trigger trg_upd_diag         before update on public.diagnosticos    for each row execute function privado.fn_set_updated_at();
create trigger trg_upd_repuestos    before update on public.repuestos       for each row execute function privado.fn_set_updated_at();
create trigger trg_upd_solicitudes  before update on public.solicitudes_compra for each row execute function privado.fn_set_updated_at();
create trigger trg_upd_presupuestos before update on public.presupuestos    for each row execute function privado.fn_set_updated_at();

create trigger trg_norm_cliente   before insert or update on public.clientes  for each row execute function privado.fn_normalizar_cliente();
create trigger trg_norm_vehiculo  before insert or update on public.vehiculos for each row execute function privado.fn_normalizar_vehiculo();

create trigger trg_auth_nuevo_usuario after insert or update of email_confirmed_at on auth.users
  for each row execute function privado.fn_nuevo_usuario_auth();

create trigger trg_orden_bi     before insert on public.ordenes_trabajo for each row execute function privado.fn_orden_before_insert();
create trigger trg_orden_ai     after  insert on public.ordenes_trabajo for each row execute function privado.fn_orden_after_insert();
create trigger trg_orden_guard  before update on public.ordenes_trabajo for each row execute function privado.fn_orden_guard_update();

create trigger trg_diag_ai      after insert on public.diagnosticos for each row execute function privado.fn_diagnostico_after_insert();

create trigger trg_mov_bi       before insert on public.movimientos_inventario for each row execute function privado.fn_movimiento_before_insert();
create trigger trg_mov_ai       after  insert on public.movimientos_inventario for each row execute function privado.fn_movimiento_after_insert();
create trigger trg_rep_ai       after  insert on public.repuestos for each row execute function privado.fn_repuesto_after_insert();
create trigger trg_rep_guard    before update on public.repuestos for each row execute function privado.fn_repuesto_guard_update();

create trigger trg_or_before    before insert or update or delete on public.orden_repuestos for each row execute function privado.fn_orden_repuesto_before();
create trigger trg_or_after     after  insert or update or delete on public.orden_repuestos for each row execute function privado.fn_orden_repuesto_after();

create trigger trg_sol_ai       after insert on public.solicitudes_compra for each row execute function privado.fn_solicitud_after_insert();

create trigger trg_pres_guard   before insert or update on public.presupuestos for each row execute function privado.fn_presupuesto_guard();
create trigger trg_item_guard   before insert or update or delete on public.presupuesto_items for each row execute function privado.fn_item_guard();
create trigger trg_item_after   after  insert or update or delete on public.presupuesto_items for each row execute function privado.fn_item_after();

create trigger trg_pago_bi      before insert on public.pagos for each row execute function privado.fn_pago_before_insert();
create trigger trg_pago_ai      after  insert on public.pagos for each row execute function privado.fn_pago_after_insert();
create trigger trg_pago_guard   before update on public.pagos for each row execute function privado.fn_pago_guard_update();

create trigger trg_notif_bi     before insert or update on public.notificaciones for each row execute function privado.fn_notificacion_before();
create trigger trg_notif_ai     after  insert or update of estado on public.notificaciones for each row execute function privado.fn_notificacion_after();

create trigger trg_avance_ai    after insert on public.avances_orden for each row execute function privado.fn_avance_after_insert();

-- Auditoría en todas las tablas que modifican una orden (RNF12) y en catálogos sensibles
do $$
declare t text;
begin
  foreach t in array array['ordenes_trabajo','fotos_orden','diagnosticos','orden_tareas','orden_repuestos','presupuestos',
                           'presupuesto_items','pagos','avances_orden','perfiles','clientes','vehiculos','repuestos','solicitudes_compra']
  loop
    execute format('create trigger trg_audit after insert or update or delete on public.%I
                    for each row execute function privado.fn_auditoria()', t);
  end loop;
end $$;

-- -----------------------------------------------------------------------------
-- 8. Funciones RPC (expuestas en /rest/v1/rpc/...)
-- -----------------------------------------------------------------------------

-- 8.1 Asignar mecánico (CU-02 post, CU-04)
create or replace function public.asignar_mecanico(p_orden uuid, p_mecanico uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare v_rol public.rol_usuario := privado.rol_actual(); v_estado public.estado_orden;
begin
  if v_rol is null or v_rol not in ('admin', 'recepcionista') then raise exception 'Sin permiso' using errcode = '42501'; end if;
  if not exists (select 1 from public.perfiles where id = p_mecanico and rol = 'mecanico' and activo) then
    raise exception 'El usuario indicado no es un mecánico activo';
  end if;
  select estado into v_estado from public.ordenes_trabajo where id = p_orden for update;
  if not found then raise exception 'Orden no encontrada' using errcode = 'P0002'; end if;
  if v_estado in ('pagado_cerrado', 'cancelada') then raise exception 'Orden cerrada'; end if;
  update public.ordenes_trabajo set mecanico_id = p_mecanico where id = p_orden;
  if v_estado = 'por_asignar' then
    perform privado.transicionar_orden(p_orden, 'por_diagnosticar', v_rol::text, 'Mecánico asignado');
  else
    perform privado.notificar(p_orden, 'orden_asignada', 'Se te reasignó una orden', null, p_mecanico);
  end if;
end $$;

-- 8.2 Cambiar estado manualmente (CU-07, CU-03 FA, cancelaciones)
create or replace function public.cambiar_estado_orden(p_orden uuid, p_estado public.estado_orden, p_nota text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare v_rol public.rol_usuario := privado.rol_actual();
begin
  if v_rol is null then raise exception 'Sin permiso' using errcode = '42501'; end if;
  if v_rol = 'mecanico' and not privado.es_mecanico_de(p_orden) then
    raise exception 'La orden no está asignada a usted' using errcode = '42501';
  end if;
  if p_estado = 'trabajo_terminado' and coalesce(trim(p_nota), '') = '' then
    raise exception 'Ingrese observaciones finales para terminar el trabajo';
  end if;
  if p_estado = 'trabajo_terminado' then
    update public.ordenes_trabajo set observaciones_finales = p_nota where id = p_orden;
  end if;
  perform privado.transicionar_orden(p_orden, p_estado, v_rol::text, p_nota);
end $$;

-- 8.3 Generar borrador de presupuesto desde los repuestos de la orden + mano de obra (CU-09, RF23, RF25)
create or replace function public.generar_presupuesto(p_orden uuid, p_mano_obra numeric, p_descripcion_mano_obra text default 'Mano de obra')
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_id uuid; v_version smallint; v_estado public.estado_orden;
begin
  if privado.rol_actual() is distinct from 'admin' then raise exception 'Sin permiso' using errcode = '42501'; end if;
  select estado into v_estado from public.ordenes_trabajo where id = p_orden for update;
  if not found then raise exception 'Orden no encontrada' using errcode = 'P0002'; end if;
  if v_estado <> 'diagnosticado' then
    raise exception 'La orden debe estar en "Diagnosticado / Esperando Presupuesto" (actual: %)', public.etiqueta_estado(v_estado);
  end if;
  if p_mano_obra is null or p_mano_obra < 0 then raise exception 'Ingrese el monto de mano de obra'; end if;
  select coalesce(max(version), 0) + 1 into v_version from public.presupuestos where orden_id = p_orden;
  insert into public.presupuestos (orden_id, version) values (p_orden, v_version) returning id into v_id;
  insert into public.presupuesto_items (presupuesto_id, tipo, repuesto_id, descripcion, cantidad, costo_unitario, precio_unitario, orden_visual)
  select v_id, 'repuesto', r.id, r.codigo || ' · ' || r.nombre, orr.cantidad, orr.costo_unitario, orr.precio_unitario,
         row_number() over (order by orr.created_at)
  from public.orden_repuestos orr join public.repuestos r on r.id = orr.repuesto_id
  where orr.orden_id = p_orden;
  insert into public.presupuesto_items (presupuesto_id, tipo, descripcion, cantidad, precio_unitario, orden_visual)
  values (v_id, 'mano_obra', p_descripcion_mano_obra, 1, p_mano_obra, 999);
  return v_id;
end $$;

-- 8.4 Publicar presupuesto → visible al cliente (CU-09 paso 6, RF26)
create or replace function public.publicar_presupuesto(p_presupuesto uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare p public.presupuestos%rowtype;
begin
  if privado.rol_actual() is distinct from 'admin' then raise exception 'Sin permiso' using errcode = '42501'; end if;
  select * into p from public.presupuestos where id = p_presupuesto for update;
  if not found then raise exception 'Presupuesto no encontrado' using errcode = 'P0002'; end if;
  if p.estado <> 'borrador' then raise exception 'Solo se publican borradores'; end if;
  if not exists (select 1 from public.presupuesto_items where presupuesto_id = p.id and tipo = 'mano_obra') then
    raise exception 'Debe asignar el valor de mano de obra (RF23)';
  end if;
  update public.presupuestos set estado = 'publicado', publicado_en = now() where id = p.id;
  perform privado.transicionar_orden(p.orden_id, 'esperando_aprobacion', 'admin', 'Presupuesto v' || p.version || ' publicado');
end $$;

-- 8.5 Lógica común de respuesta del cliente (RF33-RF35)
create or replace function privado.aplicar_respuesta(p_presupuesto uuid, p_aprobar boolean, p_motivo text, p_via text, p_actor text)
returns void language plpgsql security definer set search_path = '' as $$
declare p public.presupuestos%rowtype;
begin
  select * into p from public.presupuestos where id = p_presupuesto for update;
  if not found then raise exception 'Presupuesto no encontrado' using errcode = 'P0002'; end if;
  if p.estado <> 'publicado' then raise exception 'El presupuesto no está pendiente de respuesta'; end if;
  if not p_aprobar and coalesce(trim(p_motivo), '') = '' then
    raise exception 'Debe indicar el motivo del rechazo' using errcode = 'P0001';
  end if;
  update public.presupuestos set
    estado = case when p_aprobar then 'aprobado'::public.estado_presupuesto else 'rechazado' end,
    respondido_en = now(), respuesta_via = p_via,
    motivo_rechazo = case when p_aprobar then null else trim(p_motivo) end
  where id = p.id;
  perform privado.transicionar_orden(p.orden_id,
    case when p_aprobar then 'presupuesto_aprobado'::public.estado_orden else 'presupuesto_rechazado' end,
    p_actor, case when p_aprobar then 'Presupuesto aprobado' else 'Rechazo: ' || trim(p_motivo) end);
end $$;

-- 8.6 Respuesta registrada por el admin (cliente aprobó por teléfono o en persona)
create or replace function public.registrar_respuesta_presupuesto(p_presupuesto uuid, p_aprobar boolean, p_motivo text default null,
                                                                  p_via text default 'telefono')
returns void language plpgsql security definer set search_path = '' as $$
begin
  if privado.rol_actual() is distinct from 'admin' then raise exception 'Sin permiso' using errcode = '42501'; end if;
  perform privado.aplicar_respuesta(p_presupuesto, p_aprobar, p_motivo, p_via, 'admin');
end $$;

-- 8.7 Portal del cliente: localizar orden por patente + código de seguimiento
create or replace function privado.orden_por_codigo(p_patente text, p_codigo text)
returns public.ordenes_trabajo language plpgsql stable security definer set search_path = '' as $$
declare o public.ordenes_trabajo%rowtype;
begin
  select ot.* into o from public.ordenes_trabajo ot join public.vehiculos v on v.id = ot.vehiculo_id
  where v.patente = privado.normalizar_patente(p_patente) and ot.codigo_seguimiento = upper(trim(p_codigo));
  if not found then
    raise exception 'Datos no encontrados. Verifique la patente o contacte al taller' using errcode = 'P0002';
  end if;
  return o;
end $$;

-- CU-13 (RF32) + datos para CU-14
create or replace function public.consultar_estado_orden(p_patente text, p_codigo text)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare o public.ordenes_trabajo%rowtype; v jsonb; pr jsonb;
begin
  o := privado.orden_por_codigo(p_patente, p_codigo);
  select jsonb_build_object(
           'id', p.id, 'version', p.version, 'estado', p.estado,
           'total_repuestos', p.total_repuestos, 'total_mano_obra', p.total_mano_obra, 'total_otros', p.total_otros,
           'descuento', p.descuento, 'total', p.total, 'publicado_en', p.publicado_en, 'motivo_rechazo', p.motivo_rechazo,
           'items', coalesce((select jsonb_agg(jsonb_build_object('tipo', i.tipo, 'descripcion', i.descripcion, 'cantidad', i.cantidad,
                                                                  'precio_unitario', i.precio_unitario, 'subtotal', i.subtotal)
                                               order by i.orden_visual)
                              from public.presupuesto_items i where i.presupuesto_id = p.id), '[]'::jsonb))
    into pr
  from public.presupuestos p
  where p.orden_id = o.id and p.estado in ('publicado', 'aprobado', 'rechazado')
  order by p.version desc limit 1;

  select jsonb_build_object(
    'codigo', o.codigo, 'estado', o.estado, 'estado_texto', public.etiqueta_estado(o.estado), 'etapa', public.etapa_rnf03(o.estado),
    'avance_pct', o.avance_pct, 'fecha_ingreso', o.fecha_ingreso, 'actualizado', o.updated_at, 'kilometraje', o.kilometraje,
    'vehiculo', jsonb_build_object('patente', v2.patente, 'marca', v2.marca, 'modelo', v2.modelo, 'anio', v2.anio),
    'diagnostico', (select d.descripcion from public.diagnosticos d where d.orden_id = o.id order by d.created_at desc limit 1),
    'presupuesto', pr,
    'saldo', privado.saldo_orden(o.id))
    into v
  from public.vehiculos v2 where v2.id = o.vehiculo_id;
  return v;
end $$;

-- CU-14 (RF33-RF35) desde el portal
create or replace function public.responder_presupuesto(p_patente text, p_codigo text, p_aprobar boolean, p_motivo text default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare o public.ordenes_trabajo%rowtype; v_pres uuid;
begin
  o := privado.orden_por_codigo(p_patente, p_codigo);
  select id into v_pres from public.presupuestos where orden_id = o.id and estado = 'publicado';
  if v_pres is null then raise exception 'No hay un presupuesto pendiente de respuesta'; end if;
  perform privado.aplicar_respuesta(v_pres, p_aprobar, p_motivo, 'portal', 'cliente');
  return public.consultar_estado_orden(p_patente, p_codigo);
end $$;

-- CU-15 (RF36): historial de servicios cerrados del vehículo, del mismo cliente
create or replace function public.consultar_historial_vehiculo(p_patente text, p_codigo text)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare o public.ordenes_trabajo%rowtype;
begin
  o := privado.orden_por_codigo(p_patente, p_codigo);
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'codigo', h.codigo, 'fecha_ingreso', h.fecha_ingreso, 'fecha_entrega', h.fecha_entrega, 'kilometraje', h.kilometraje,
      'motivo', h.motivo_ingreso, 'observaciones_finales', h.observaciones_finales,
      'diagnostico', (select string_agg(d.descripcion, ' | ' order by d.created_at) from public.diagnosticos d where d.orden_id = h.id),
      'trabajos', (select coalesce(jsonb_agg(t.descripcion), '[]') from public.orden_tareas t where t.orden_id = h.id and t.completada),
      'repuestos', (select coalesce(jsonb_agg(jsonb_build_object('nombre', r.nombre, 'cantidad', orr.cantidad)), '[]')
                    from public.orden_repuestos orr join public.repuestos r on r.id = orr.repuesto_id where orr.orden_id = h.id)
    ) order by h.fecha_ingreso desc)
    from public.ordenes_trabajo h
    where h.vehiculo_id = o.vehiculo_id and h.cliente_id = o.cliente_id and h.estado = 'pagado_cerrado'), '[]'::jsonb);
end $$;

-- Permisos de ejecución
revoke execute on all functions in schema public from public, anon;
grant execute on all functions in schema public to authenticated;
grant execute on function public.consultar_estado_orden(text, text),
                          public.responder_presupuesto(text, text, boolean, text),
                          public.consultar_historial_vehiculo(text, text),
                          public.etiqueta_estado(public.estado_orden),
                          public.etapa_rnf03(public.estado_orden)
  to anon;

-- -----------------------------------------------------------------------------
-- 9. Vistas (security_invoker: respetan el RLS de quien consulta)
-- -----------------------------------------------------------------------------

-- RNF02: panel general en tiempo real
create view public.v_panel_ordenes with (security_invoker = true) as
select o.id, o.codigo, o.estado, public.etiqueta_estado(o.estado) as estado_texto, public.etapa_rnf03(o.estado) as etapa,
       v.patente, v.marca, v.modelo, v.anio, c.nombre as cliente, c.telefono as cliente_telefono,
       m.nombre_completo as mecanico, o.mecanico_id, o.avance_pct, o.kilometraje, o.motivo_ingreso,
       o.fecha_ingreso, o.updated_at,
       round(extract(epoch from (coalesce(o.fecha_entrega, now()) - o.fecha_ingreso)) / 3600.0, 1) as horas_en_taller
from public.ordenes_trabajo o
join public.vehiculos v on v.id = o.vehiculo_id
join public.clientes  c on c.id = o.cliente_id
left join public.perfiles m on m.id = o.mecanico_id;

-- RF30: saldo por orden (admin o el propio cliente)
create view public.v_saldo_ordenes with (security_invoker = true) as
select o.id as orden_id, o.codigo, o.estado,
       coalesce(p.total, 0) as total_aprobado,
       coalesce((select sum(g.monto) from public.pagos g where g.orden_id = o.id and not g.anulado), 0) as pagado,
       coalesce(p.total, 0) - coalesce((select sum(g.monto) from public.pagos g where g.orden_id = o.id and not g.anulado), 0) as saldo
from public.ordenes_trabajo o
left join public.presupuestos p on p.orden_id = o.id and p.estado = 'aprobado'
where privado.rol_actual() = 'admin' or o.cliente_id = privado.cliente_actual();

-- CU-12 / RF31: reporte financiero mensual
create view public.v_reporte_financiero_mensual with (security_invoker = true) as
with cerradas as (
  select date_trunc('month', o.fecha_entrega at time zone 'America/Santiago')::date as mes,
         count(*) as ordenes_cerradas,
         sum(p.total) as facturado, sum(p.total_repuestos) as venta_repuestos, sum(p.total_mano_obra) as mano_obra,
         sum(p.costo_interno) as costo_repuestos, sum(p.margen) as margen_bruto
  from public.ordenes_trabajo o join public.presupuestos p on p.orden_id = o.id and p.estado = 'aprobado'
  where o.estado = 'pagado_cerrado'
  group by 1),
caja as (
  select date_trunc('month', g.created_at at time zone 'America/Santiago')::date as mes,
         sum(g.monto) as ingresos_caja, count(*) filter (where g.es_abono) as abonos
  from public.pagos g where not g.anulado group by 1),
compras as (
  select date_trunc('month', mi.created_at at time zone 'America/Santiago')::date as mes,
         sum(mi.cantidad * mi.costo_unitario) as egresos_compras
  from public.movimientos_inventario mi where mi.tipo in ('entrada', 'inicial') group by 1)
select coalesce(ce.mes, ca.mes, co.mes) as mes,
       coalesce(ce.ordenes_cerradas, 0) as ordenes_cerradas, coalesce(ce.facturado, 0) as facturado,
       coalesce(ce.venta_repuestos, 0) as venta_repuestos, coalesce(ce.mano_obra, 0) as mano_obra,
       coalesce(ce.costo_repuestos, 0) as costo_repuestos, coalesce(ce.margen_bruto, 0) as margen_bruto,
       coalesce(ca.ingresos_caja, 0) as ingresos_caja, coalesce(ca.abonos, 0) as abonos,
       coalesce(co.egresos_compras, 0) as egresos_compras
from cerradas ce
full join caja ca on ca.mes = ce.mes
full join compras co on co.mes = coalesce(ce.mes, ca.mes)
where privado.rol_actual() = 'admin';

-- CU-12: flujo de vehículos
create view public.v_flujo_vehiculos with (security_invoker = true) as
select date_trunc('month', o.fecha_ingreso at time zone 'America/Santiago')::date as mes,
       count(*) as ingresados,
       count(*) filter (where o.estado = 'pagado_cerrado') as entregados,
       count(*) filter (where o.estado = 'cancelada') as cancelados,
       count(*) filter (where o.estado not in ('pagado_cerrado', 'cancelada')) as en_taller,
       round(avg(extract(epoch from (o.fecha_entrega - o.fecha_ingreso)) / 86400.0) filter (where o.fecha_entrega is not null), 1)
         as dias_promedio_estadia
from public.ordenes_trabajo o
where privado.rol_actual() = 'admin'
group by 1;

-- CU-12: consumo de repuestos
create view public.v_consumo_repuestos with (security_invoker = true) as
select date_trunc('month', mi.created_at at time zone 'America/Santiago')::date as mes,
       r.codigo, r.nombre, cr.nombre as categoria,
       sum(case when mi.tipo = 'salida_orden' then mi.cantidad else -mi.cantidad end) as unidades,
       sum(case when mi.tipo = 'salida_orden' then 1 else -1 end * mi.cantidad * mi.costo_unitario) as costo_total
from public.movimientos_inventario mi
join public.repuestos r on r.id = mi.repuesto_id
left join public.categorias_repuesto cr on cr.id = r.categoria_id
where mi.tipo in ('salida_orden', 'devolucion_orden') and privado.rol_actual() = 'admin'
group by 1, 2, 3, 4;

-- CU-12: rendimiento del equipo
create view public.v_rendimiento_mecanicos with (security_invoker = true) as
select m.id as mecanico_id, m.nombre_completo,
       count(o.id) as ordenes_asignadas,
       count(o.id) filter (where o.fecha_termino is not null) as ordenes_terminadas,
       round(avg(extract(epoch from (o.fecha_termino - o.fecha_ingreso)) / 3600.0) filter (where o.fecha_termino is not null), 1)
         as horas_promedio_hasta_termino,
       coalesce(sum(p.total_mano_obra) filter (where o.estado = 'pagado_cerrado'), 0) as mano_obra_generada
from public.perfiles m
left join public.ordenes_trabajo o on o.mecanico_id = m.id
left join public.presupuestos p on p.orden_id = o.id and p.estado = 'aprobado'
where m.rol = 'mecanico' and privado.rol_actual() = 'admin'
group by m.id, m.nombre_completo;

-- Alerta de stock bajo (apoyo a CU-06 / CU-10)
create view public.v_stock_bajo with (security_invoker = true) as
select r.id, r.codigo, r.nombre, r.stock, r.stock_minimo,
       (select count(*) from public.solicitudes_compra s where s.repuesto_id = r.id and s.estado in ('pendiente','aprobada','comprada'))
         as solicitudes_abiertas
from public.repuestos r
where r.activo and r.stock <= r.stock_minimo;

-- -----------------------------------------------------------------------------
-- 10. Row Level Security
-- -----------------------------------------------------------------------------
alter table public.perfiles               enable row level security;
alter table public.clientes               enable row level security;
alter table public.vehiculos              enable row level security;
alter table public.ordenes_trabajo        enable row level security;
alter table public.fotos_orden            enable row level security;
alter table public.diagnosticos           enable row level security;
alter table public.catalogo_tareas        enable row level security;
alter table public.orden_tareas           enable row level security;
alter table public.categorias_repuesto    enable row level security;
alter table public.repuestos              enable row level security;
alter table public.movimientos_inventario enable row level security;
alter table public.orden_repuestos        enable row level security;
alter table public.solicitudes_compra     enable row level security;
alter table public.presupuestos           enable row level security;
alter table public.presupuesto_items      enable row level security;
alter table public.pagos                  enable row level security;
alter table public.notificaciones         enable row level security;
alter table public.historial_estados      enable row level security;
alter table public.avances_orden          enable row level security;
alter table public.auditoria              enable row level security;
alter table public.transiciones_estado    enable row level security;

-- perfiles (CU-08)
create policy perfiles_select on public.perfiles for select to authenticated
  using (id = (select auth.uid()) or (select privado.es_staff()));
create policy perfiles_update_admin on public.perfiles for update to authenticated
  using ((select privado.rol_actual()) = 'admin') with check ((select privado.rol_actual()) = 'admin');

-- clientes (CU-01, RNF11)
create policy clientes_select on public.clientes for select to authenticated
  using ((select privado.es_staff()) or id = (select privado.cliente_actual()));
create policy clientes_insert on public.clientes for insert to authenticated
  with check ((select privado.rol_actual()) in ('admin', 'recepcionista'));
create policy clientes_update on public.clientes for update to authenticated
  using ((select privado.rol_actual()) in ('admin', 'recepcionista'))
  with check ((select privado.rol_actual()) in ('admin', 'recepcionista'));
create policy clientes_delete on public.clientes for delete to authenticated
  using ((select privado.rol_actual()) = 'admin');

-- vehiculos (CU-01, RNF11)
create policy vehiculos_select on public.vehiculos for select to authenticated
  using ((select privado.es_staff()) or cliente_id = (select privado.cliente_actual()));
create policy vehiculos_insert on public.vehiculos for insert to authenticated
  with check ((select privado.rol_actual()) in ('admin', 'recepcionista'));
create policy vehiculos_update on public.vehiculos for update to authenticated
  using ((select privado.rol_actual()) in ('admin', 'recepcionista'))
  with check ((select privado.rol_actual()) in ('admin', 'recepcionista'));
create policy vehiculos_delete on public.vehiculos for delete to authenticated
  using ((select privado.rol_actual()) = 'admin');

-- ordenes_trabajo (CU-02, CU-04, CU-07, CU-13; RNF10, RNF11)
create policy ordenes_select on public.ordenes_trabajo for select to authenticated
  using (
    (select privado.rol_actual()) in ('admin', 'recepcionista')
    or ((select privado.rol_actual()) = 'mecanico' and (mecanico_id = (select auth.uid()) or estado = 'por_asignar'))
    or cliente_id = (select privado.cliente_actual()));
create policy ordenes_insert on public.ordenes_trabajo for insert to authenticated
  with check ((select privado.rol_actual()) in ('admin', 'recepcionista'));
create policy ordenes_update on public.ordenes_trabajo for update to authenticated
  using ((select privado.rol_actual()) in ('admin', 'recepcionista')
         or ((select privado.rol_actual()) = 'mecanico' and mecanico_id = (select auth.uid())))
  with check ((select privado.rol_actual()) in ('admin', 'recepcionista')
         or ((select privado.rol_actual()) = 'mecanico' and mecanico_id = (select auth.uid())));
-- Sin política DELETE: las órdenes se cancelan, no se borran.

-- fotos_orden (RF06, RF11)
create policy fotos_select on public.fotos_orden for select to authenticated
  using (privado.puede_ver_orden(orden_id));
create policy fotos_insert on public.fotos_orden for insert to authenticated
  with check ((select privado.rol_actual()) in ('admin', 'recepcionista') or privado.es_mecanico_de(orden_id));
create policy fotos_delete on public.fotos_orden for delete to authenticated
  using ((select privado.rol_actual()) = 'admin' or subido_por = (select auth.uid()));

-- diagnosticos (CU-05)
create policy diag_select on public.diagnosticos for select to authenticated
  using (privado.puede_ver_orden(orden_id));
create policy diag_insert on public.diagnosticos for insert to authenticated
  with check ((select privado.rol_actual()) = 'admin' or (privado.es_mecanico_de(orden_id) and mecanico_id = (select auth.uid())));
create policy diag_update on public.diagnosticos for update to authenticated
  using ((select privado.rol_actual()) = 'admin' or mecanico_id = (select auth.uid()))
  with check ((select privado.rol_actual()) = 'admin' or (mecanico_id = (select auth.uid()) and privado.es_mecanico_de(orden_id)));

-- catalogo_tareas / categorias_repuesto (catálogos)
create policy cat_tareas_select on public.catalogo_tareas for select to authenticated using ((select privado.es_staff()));
create policy cat_tareas_write  on public.catalogo_tareas for all to authenticated
  using ((select privado.rol_actual()) = 'admin') with check ((select privado.rol_actual()) = 'admin');
create policy cat_rep_select on public.categorias_repuesto for select to authenticated using ((select privado.es_staff()));
create policy cat_rep_write  on public.categorias_repuesto for all to authenticated
  using ((select privado.rol_actual()) = 'admin') with check ((select privado.rol_actual()) = 'admin');

-- orden_tareas (CU-05, CU-15)
create policy tareas_select on public.orden_tareas for select to authenticated
  using (privado.puede_ver_orden(orden_id));
create policy tareas_write on public.orden_tareas for all to authenticated
  using ((select privado.rol_actual()) = 'admin' or privado.es_mecanico_de(orden_id))
  with check ((select privado.rol_actual()) = 'admin' or privado.es_mecanico_de(orden_id));

-- repuestos (CU-06 búsqueda, CU-10 gestión)
create policy repuestos_select on public.repuestos for select to authenticated using ((select privado.es_staff()));
create policy repuestos_insert on public.repuestos for insert to authenticated
  with check ((select privado.rol_actual()) = 'admin');
create policy repuestos_update on public.repuestos for update to authenticated
  using ((select privado.rol_actual()) = 'admin') with check ((select privado.rol_actual()) = 'admin');

-- movimientos_inventario (kárdex inmutable; salidas solo por trigger)
create policy mov_select on public.movimientos_inventario for select to authenticated
  using ((select privado.rol_actual()) = 'admin');
create policy mov_insert on public.movimientos_inventario for insert to authenticated
  with check ((select privado.rol_actual()) = 'admin' and tipo in ('entrada', 'ajuste_positivo', 'ajuste_negativo'));

-- orden_repuestos (CU-06)
create policy or_select on public.orden_repuestos for select to authenticated
  using ((select privado.rol_actual()) in ('admin', 'recepcionista') or privado.es_mecanico_de(orden_id));
create policy or_write on public.orden_repuestos for all to authenticated
  using ((select privado.rol_actual()) = 'admin' or privado.es_mecanico_de(orden_id))
  with check ((select privado.rol_actual()) = 'admin' or privado.es_mecanico_de(orden_id));

-- solicitudes_compra (RF17)
create policy sol_select on public.solicitudes_compra for select to authenticated
  using ((select privado.rol_actual()) = 'admin' or solicitado_por = (select auth.uid())
         or (orden_id is not null and privado.es_mecanico_de(orden_id)));
create policy sol_insert on public.solicitudes_compra for insert to authenticated
  with check ((select privado.rol_actual()) = 'admin'
              or ((select privado.rol_actual()) = 'mecanico' and (orden_id is null or privado.es_mecanico_de(orden_id))));
create policy sol_update on public.solicitudes_compra for update to authenticated
  using ((select privado.rol_actual()) = 'admin') with check ((select privado.rol_actual()) = 'admin');

-- presupuestos (CU-09 admin, CU-14 cliente)
create policy pres_select on public.presupuestos for select to authenticated
  using ((select privado.rol_actual()) in ('admin', 'recepcionista')
         or privado.es_mecanico_de(orden_id)
         or (estado <> 'borrador' and exists (select 1 from public.ordenes_trabajo o
                                              where o.id = orden_id and o.cliente_id = (select privado.cliente_actual()))));
create policy pres_update on public.presupuestos for update to authenticated
  using ((select privado.rol_actual()) = 'admin') with check ((select privado.rol_actual()) = 'admin');

create policy items_select on public.presupuesto_items for select to authenticated
  using (exists (select 1 from public.presupuestos p where p.id = presupuesto_id));   -- hereda el RLS de presupuestos
create policy items_write on public.presupuesto_items for all to authenticated
  using ((select privado.rol_actual()) = 'admin') with check ((select privado.rol_actual()) = 'admin');

-- pagos (CU-11; RNF10: el mecánico no ve ni toca pagos)
create policy pagos_select on public.pagos for select to authenticated
  using ((select privado.rol_actual()) = 'admin'
         or exists (select 1 from public.ordenes_trabajo o where o.id = orden_id and o.cliente_id = (select privado.cliente_actual())));
create policy pagos_insert on public.pagos for insert to authenticated
  with check ((select privado.rol_actual()) = 'admin');
create policy pagos_update on public.pagos for update to authenticated
  using ((select privado.rol_actual()) = 'admin') with check ((select privado.rol_actual()) = 'admin');

-- notificaciones (RF08, RF09, RF14, RF19)
create policy notif_select on public.notificaciones for select to authenticated
  using ((select privado.rol_actual()) in ('admin', 'recepcionista')
         or destinatario_usuario_id = (select auth.uid())
         or destinatario_rol = (select privado.rol_actual())
         or destinatario_cliente_id = (select privado.cliente_actual()));
create policy notif_insert on public.notificaciones for insert to authenticated
  with check ((select privado.rol_actual()) in ('admin', 'recepcionista'));
create policy notif_update on public.notificaciones for update to authenticated
  using ((select privado.rol_actual()) in ('admin', 'recepcionista')
         or destinatario_usuario_id = (select auth.uid()) or destinatario_rol = (select privado.rol_actual()))
  with check ((select privado.es_staff()));

-- historial_estados (lectura; escritura solo por el motor de estados)
create policy hist_select on public.historial_estados for select to authenticated
  using (privado.puede_ver_orden(orden_id));

-- avances_orden (CU-07 FA: visibles a recepción y admin)
create policy avances_select on public.avances_orden for select to authenticated
  using ((select privado.rol_actual()) in ('admin', 'recepcionista') or privado.es_mecanico_de(orden_id));
create policy avances_insert on public.avances_orden for insert to authenticated
  with check ((select privado.rol_actual()) = 'admin' or (privado.es_mecanico_de(orden_id) and mecanico_id = (select auth.uid())));

-- auditoria (RNF12: solo lectura admin; nadie la modifica)
create policy audit_select on public.auditoria for select to authenticated
  using ((select privado.rol_actual()) = 'admin');

-- transiciones_estado (lectura para pintar botones según rol, RNF04)
create policy trans_select on public.transiciones_estado for select to authenticated using (true);

-- -----------------------------------------------------------------------------
-- 11. Storage: bucket privado de fotos (RF06, RNF07). Ruta: {orden_id}/{archivo}
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('fotos-ordenes', 'fotos-ordenes', false, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/heic'])
on conflict (id) do nothing;

create policy fotos_storage_select on storage.objects for select to authenticated
  using (bucket_id = 'fotos-ordenes' and privado.puede_ver_orden(((storage.foldername(name))[1])::uuid));
create policy fotos_storage_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'fotos-ordenes'
              and ((select privado.rol_actual()) in ('admin', 'recepcionista')
                   or privado.es_mecanico_de(((storage.foldername(name))[1])::uuid)));
create policy fotos_storage_delete on storage.objects for delete to authenticated
  using (bucket_id = 'fotos-ordenes' and ((select privado.rol_actual()) = 'admin' or owner = (select auth.uid())));

-- -----------------------------------------------------------------------------
-- 12. Realtime (RNF02: panel en tiempo real; respeta RLS)
-- -----------------------------------------------------------------------------
alter publication supabase_realtime add table public.ordenes_trabajo, public.notificaciones, public.avances_orden;

-- -----------------------------------------------------------------------------
-- 13. Datos semilla: reglas de transición (RNF03)
-- -----------------------------------------------------------------------------
insert into public.transiciones_estado (origen, destino, roles) values
  ('por_asignar',           'por_diagnosticar',      '{admin,recepcionista}'),
  ('por_diagnosticar',      'diagnosticado',         '{sistema}'),
  ('por_diagnosticar',      'esperando_repuesto',    '{sistema}'),
  ('diagnosticado',         'esperando_repuesto',    '{sistema}'),
  ('diagnosticado',         'esperando_aprobacion',  '{admin}'),
  ('esperando_aprobacion',  'presupuesto_aprobado',  '{cliente,admin}'),
  ('esperando_aprobacion',  'presupuesto_rechazado', '{cliente,admin}'),
  ('esperando_aprobacion',  'diagnosticado',         '{admin}'),
  ('presupuesto_rechazado', 'diagnosticado',         '{admin}'),
  ('presupuesto_rechazado', 'listo_entrega',         '{admin,recepcionista}'),
  ('presupuesto_aprobado',  'en_reparacion',         '{mecanico,admin}'),
  ('presupuesto_aprobado',  'trabajo_terminado',     '{mecanico,admin}'),
  ('presupuesto_aprobado',  'esperando_repuesto',    '{sistema}'),
  ('esperando_repuesto',    'por_diagnosticar',      '{mecanico,admin}'),
  ('esperando_repuesto',    'diagnosticado',         '{mecanico,admin}'),
  ('esperando_repuesto',    'en_reparacion',         '{mecanico,admin}'),
  ('en_reparacion',         'esperando_repuesto',    '{sistema}'),
  ('en_reparacion',         'pruebas_ruta',          '{mecanico,admin}'),
  ('en_reparacion',         'trabajo_terminado',     '{mecanico,admin}'),
  ('pruebas_ruta',          'en_reparacion',         '{mecanico,admin}'),
  ('pruebas_ruta',          'trabajo_terminado',     '{mecanico,admin}'),
  ('trabajo_terminado',     'listo_entrega',         '{sistema,admin,recepcionista}'),
  ('listo_entrega',         'pagado_cerrado',        '{sistema,admin}');

insert into public.transiciones_estado (origen, destino, roles)
select e, 'cancelada', '{admin}'
from unnest(enum_range(null::public.estado_orden)) e
where e not in ('pagado_cerrado', 'cancelada');

insert into public.categorias_repuesto (nombre) values
  ('Frenos'), ('Motor'), ('Suspensión'), ('Transmisión'), ('Eléctrico'), ('Filtros y lubricantes'), ('Carrocería'), ('Neumáticos');

-- FIN
