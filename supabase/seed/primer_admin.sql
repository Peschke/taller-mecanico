-- Crea el primer administrador.
-- 1) Supabase → Authentication → Users → "Add user" (correo + contraseña, marcar "Auto Confirm User").
-- 2) Reemplaza el correo y el nombre, y ejecuta este script en el SQL Editor.

update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"rol":"admin","nombre":"Administrador"}'::jsonb
where email = 'admin@taller.cl';

insert into public.perfiles (id, nombre_completo, correo, rol)
select id, 'Administrador', email, 'admin'
from auth.users
where email = 'admin@taller.cl'
on conflict (id) do update set rol = 'admin', activo = true;
