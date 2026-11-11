# Taller · Frontend (React + Vite + Supabase)

## Puesta en marcha

1. **Base de datos.** En Supabase → SQL Editor, ejecuta `supabase/migrations/0001_taller_schema.sql` completo.
2. **Ajustes de Auth.** Authentication → Providers → Email: activa "Confirm email"; desactiva "Allow new users to sign up" con contraseña si tu plan lo permite (el enlace mágico de clientes sigue funcionando).
   Authentication → URL Configuration: agrega `http://localhost:5173/auth/callback` y `http://localhost:5173/actualizar-clave` a "Redirect URLs".
3. **Primer administrador.** Crea el usuario en Authentication → Users y ejecuta `supabase/seed/primer_admin.sql` con su correo.
4. **Edge Function de usuarios (CU-08).** Con la CLI de Supabase:
   ```bash
   supabase login
   supabase link --project-ref TU_PROJECT_REF
   supabase functions deploy crear-usuario
   ```
   Usa las variables `SUPABASE_URL`, `SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_ROLE_KEY` que Supabase ya inyecta.
5. **Variables de entorno.**
   ```bash
   cp .env.example .env.local   # completa URL y anon key
   ```
6. **Ejecutar.**
   ```bash
   npm install
   npm run dev
   ```
   Abre http://localhost:5173 e ingresa en `/login` con el administrador.

## Estado por módulo

| Módulo | Estado |
| --- | --- |
| 1 · Estructura | Listo |
| 2 · Configuración de Supabase | Listo |
| 3 · Autenticación (personal, enlace mágico, recuperación) | Listo |
| 4 · Protección por roles | Listo |
| 5 · Layouts | Listo |
| 6 · Dashboard Administrador: panel, órdenes, presupuestos (CU-09), caja y cobro (CU-11), inventario y compras (CU-10), reportes (CU-12), usuarios (CU-08), catálogos, auditoría | Listo |
| 7 · Dashboard Recepcionista: panel, registro de cliente y vehículo (CU-01), orden de trabajo con fotos (CU-02), clientes, vehículos, fichas, por notificar y aviso al cliente (CU-03), buscador global | Listo |
| 8 · Dashboard Mecánico | Pendiente |
| 9 · Portal Cliente | Pendiente |
| 10–15 · Taller, inventario, presupuesto y cobro, usuarios, reportes | Pendiente |

Las pantallas pendientes muestran "Pantalla en construcción" con el módulo que las implementa.

## Aviso por correo (CU-03 · RF08)

El correo al cliente lo envía la Edge Function `notificar-cliente` usando Resend.

```bash
supabase functions deploy notificar-cliente
supabase secrets set RESEND_API_KEY=re_xxx NOTIFICACIONES_FROM="Taller <avisos@tudominio.cl>" APP_URL=https://tu-app.cl
```

Sin estos secretos la función responde 503 y la pantalla ofrece registrar el aviso por llamada.
WhatsApp (RF09) abre `wa.me` con el mensaje listo; al confirmar el envío se registra la notificación y la orden pasa a **Listo para entrega**.

## Scripts

- `npm run dev` · servidor de desarrollo
- `npm run build` · build de producción en `dist/`
- `npm run preview` · sirve el build
- `npm run lint` · ESLint
