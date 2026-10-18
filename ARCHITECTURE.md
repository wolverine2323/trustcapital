# ARCHITECTURE — Trust Capital Marketplace

## Vista general

```
Navegador (web app responsive)
   │
   ▼
Next.js 15 en Vercel
   ├─ Páginas públicas (SSG/SSR)
   ├─ /app/** (Server Components, sesión obligatoria)
   ├─ Server Actions  ← única vía de escritura desde la UI
   └─ middleware.ts   ← refresco de sesión + guardas por rol
   │
   ▼
Supabase
   ├─ Auth (correo + contraseña, confirmación, recuperación, MFA TOTP admin)
   ├─ PostgreSQL (RLS en todas las tablas, triggers de auditoría y comisiones)
   └─ Storage (buckets privados, URLs firmadas de corta duración)
```

## Capas

| Capa | Ubicación | Responsabilidad | Regla |
|---|---|---|---|
| Interfaz | `src/app`, `src/components` | Render, formularios, estados de carga/vacíos/error | No contiene reglas de negocio ni cálculos monetarios |
| Validación | `src/lib/validation` | Esquemas Zod compartidos cliente/servidor | Todo input se valida otra vez en el servidor |
| Reglas de negocio | `src/lib/finance`, `src/lib/domain` | LTV, intereses, desembolso neto, 50/50, transiciones de estado, alertas de política | Funciones puras, 100 % probadas |
| Acceso a datos | `src/server/*` | Server Actions y consultas | Usa el cliente con la sesión del usuario (RLS activo). El cliente `service_role` solo en tareas administrativas puntuales, nunca expuesto |
| Seguridad | `supabase/migrations`, `middleware.ts` | RLS, funciones `security definer`, guardas de ruta | La BD es la última línea de defensa |

## Estructura de carpetas

```
trust-capital/
├─ src/
│  ├─ app/
│  │  ├─ (public)/            inicio, como-funciona, brokers, inversionistas, solicitar-credito, terminos, privacidad
│  │  ├─ (auth)/              login, registro, recuperar-contrasena, auth/callback
│  │  └─ app/
│  │     ├─ layout.tsx        shell con sidebar + header, menú por rol
│  │     ├─ page.tsx          redirige al panel del rol
│  │     ├─ perfil/  notificaciones/
│  │     ├─ broker/  solicitante/  inversionista/  admin/
│  ├─ components/
│  │  ├─ ui/                  shadcn (button, card, input, dialog, table, badge…)
│  │  ├─ layout/              sidebar, header, mobile-nav, page-header
│  │  └─ shared/              kpi-card, status-badge, empty-state, money, stepper
│  ├─ lib/
│  │  ├─ finance/             money.ts, ltv.ts, interest.ts, disbursement.ts, commission.ts (+ tests)
│  │  ├─ domain/              roles.ts, statuses.ts, navigation.ts, policy-alerts.ts
│  │  ├─ validation/          esquemas Zod
│  │  └─ supabase/            client.ts (browser), server.ts (SSR), middleware.ts
│  ├─ server/                 actions por módulo (auth, onboarding, cases, commissions…)
│  └─ styles/                 globals.css con tokens de diseño
├─ supabase/
│  ├─ migrations/             SQL versionado
│  └─ seed.sql                datos demostrativos (sin datos sensibles reales)
├─ PLAN.md  ARCHITECTURE.md  DATABASE.md  SECURITY.md  README.md
```

## Autenticación y roles

- `@supabase/ssr` con cookies; sesión validada en el servidor con `auth.getUser()` (no se confía en `getSession()` del cliente).
- Un usuario puede tener uno o más roles en `user_roles`; el rol activo se guarda en `profiles.primary_role`.
- `middleware.ts`: sin sesión → `/login`; ruta `/app/admin/**` sin rol `ADMIN` → `/app`; igual para cada rol.
- Administradores: MFA TOTP obligatorio. Las rutas admin exigen nivel `aal2`; las políticas RLS admin también lo verifican (`auth.jwt()->>'aal' = 'aal2'`).

## Sistema visual

Tokens en CSS variables (`globals.css`), consumidos por Tailwind:

| Token | Uso | Valor provisional |
|---|---|---|
| `--primary` | Azul marino institucional | `#0B1F3A` |
| `--accent` | Verde azulado | `#14A39A` |
| `--background` / `--card` | Fondos | `#F7F8FA` / `#FFFFFF` |
| `--muted` | Grises neutros | escala slate |
| `--success / --warning / --danger` | Estados y alertas | verde / ámbar / rojo |

Tipografía Inter (`next/font`), íconos Lucide, números tabulares en importes. Cambiar la marca = cambiar tokens, sin tocar componentes.

## Motor financiero

- `Money` basado en `decimal.js`, redondeo bancario desactivado (ROUND_HALF_UP, 2 decimales) salvo indicación contractual.
- Funciones: `ltv(loan, acceptedValue)` (lanza error sin valor aceptado), `monthlyInterest`, `totalInterest`, `netDisbursement` (sin descuentos duplicados), `splitCommission(base, brokerPct = 50)`.
- La BD repite el cálculo del 50/50 en un trigger para que ningún cliente pueda alterar el reparto.

## Despliegue

- Entornos: `development` (local), `preview` (Vercel por rama), `production` (solo con autorización explícita).
- Variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (solo servidor), `NEXT_PUBLIC_SITE_URL`.
