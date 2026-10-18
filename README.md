# Trust Capital Marketplace

Plataforma privada de créditos con garantía hipotecaria e inversiones (Costa Rica).
Stack: Next.js 15 (App Router) · TypeScript · Tailwind CSS 4 · Supabase (Auth, PostgreSQL + RLS, Storage) · Vercel.

Documentación: [PLAN](PLAN.md) · [ARCHITECTURE](ARCHITECTURE.md) · [DATABASE](DATABASE.md) · [SECURITY](SECURITY.md)

## Puesta en marcha

```bash
npm install
cp .env.example .env.local   # completar con los datos del proyecto Supabase
npm run dev
```

1. Aplicar las migraciones de `supabase/migrations/` en orden (Supabase CLI `supabase db push` o el editor SQL).
2. En Supabase → Authentication → URL Configuration: *Site URL* = `NEXT_PUBLIC_SITE_URL` y agregar `…/auth/callback` y `…/auth/confirm` a *Redirect URLs*.
3. Recomendado: en las plantillas de correo usar `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/app` (funciona aunque el enlace se abra en otro dispositivo). Activar *Leaked password protection*.
4. Crear el primer administrador: registrar el usuario en Authentication → Users y ejecutar en SQL:
   ```sql
   insert into public.user_roles (user_id, role) values ('<uuid>', 'ADMIN');
   update public.profiles set primary_role = 'ADMIN' where id = '<uuid>';
   ```
   Al ingresar, la app exigirá activar la verificación en dos pasos (MFA) antes de abrir el panel admin.

## Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor local |
| `npm run build` | Build de producción |
| `npm run lint` / `npm run typecheck` | Calidad |
| `npm test` | Pruebas: motor financiero + RLS/triggers sobre PostgreSQL en memoria (PGlite) |

## Variables de entorno

| Variable | Uso |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (o `NEXT_PUBLIC_SUPABASE_ANON_KEY`) | Clave pública |
| `NEXT_PUBLIC_SITE_URL` | URL pública para enlaces de correo |
