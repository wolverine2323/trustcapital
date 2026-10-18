# PLAN — Trust Capital Marketplace

Plan de implementación del MVP. Fuente: *Prompt Maestro — Trust Capital Marketplace* (18-oct-2026).

## Principios

1. Construir por fases; cada fase queda funcional y verificada antes de avanzar.
2. Toda regla de permisos vive en el servidor y en RLS, nunca solo en la interfaz.
3. Todo cálculo monetario sale de una sola biblioteca (`src/lib/finance`) con pruebas.
4. Datos pendientes se muestran como **pendientes**, nunca como verificados.
5. Nada se publica automáticamente; solo el administrador publica.
6. El MVP no custodia fondos ni ejecuta transferencias.

## Decisiones tomadas

| Tema | Decisión |
|---|---|
| Stack | Next.js 15 (App Router) + TypeScript estricto + Tailwind + shadcn/ui + Supabase + Vercel |
| Moneda | USD por defecto; columna `currency` en todo importe para soportar CRC después |
| Dinero en BD | `numeric(14,2)`; tasas y porcentajes `numeric(7,4)` |
| Dinero en código | `decimal.js`; nunca `number` para operaciones monetarias |
| Comisiones | Dos beneficiarios: Trust Capital y broker originador. 50/50 por defecto sobre la comisión **elegible recibida**. Sin referidores ni multinivel |
| Redondeo 50/50 | Broker = `round(base × %broker, 2)`; Trust Capital = `base − broker`. Así la suma siempre cuadra al centavo |
| Oportunidades | Tabla separada del expediente. El inversionista nunca lee `loan_applications`; solo la copia publicada y autorizada |
| Estados | Estado principal del expediente + dimensiones separadas (análisis, comercial, publicación, financiero, legal) |
| Acuerdos | Versionados. Cada aceptación guarda versión, hash del texto, fecha, hora, IP y user-agent |
| Casos históricos | Se importan marcados `is_historical = true`, `verification_status = 'unverified'`, nunca publicados |

## Fases

### Fase 1 — Fundamentos *(código completo; pendiente conectar Supabase)*
- [x] Proyecto Next.js, ESLint, TypeScript estricto, Vitest
- [x] Sistema visual: tokens (azul marino, verde azulado, grises), Inter, Lucide, componentes base shadcn
- [ ] Supabase: proyecto creado y migración aplicada (migración escrita y probada localmente) (identidad, roles, auditoría, configuración)
- [x] RLS base y funciones `has_role()` / `is_admin()`
- [x] Auth: registro, login, confirmación de correo, recuperación de contraseña, sesiones SSR
- [x] Onboarding: "¿Cómo deseas utilizar Trust Capital?" → formulario por rol
- [x] Layout de app: sidebar, header, navegación móvil, menú por rol
- [x] Dashboards iniciales por rol (con estados vacíos)
- [x] Middleware de protección de rutas por rol
- [x] Páginas públicas: inicio, cómo funciona, brokers, inversionistas, solicitar crédito, términos, privacidad
- [x] Biblioteca financiera (LTV, intereses, desembolso neto, 50/50) con pruebas

**Criterio de cierre:** un usuario de cada rol puede registrarse, confirmar correo, entrar y ver solo su panel; un usuario no puede abrir rutas de otro rol ni leer datos ajenos (probado contra RLS).

### Fase 2 — Originación
Registro completo de brokers y solicitantes, aprobación de brokers, aceptación del acuerdo versionado, asistente de caso en 6 pasos (broker) y 5 pasos (solicitante), propiedades múltiples, carga de documentos a buckets privados, revisión administrativa, historial de estados, dashboards de broker y solicitante.

### Fase 3 — Marketplace
Registro y perfil de inversionista (KYC progresivo), preparación y publicación de oportunidades, marketplace con filtros y orden, detalle de oportunidad, favoritos, manifestación de interés, notificaciones internas.

### Fase 4 — Finanzas y operaciones
Panel de comisiones (registro de comisión recibida, devengo, aprobación, pagos parciales, comprobantes, ajustes), matching por reglas, operaciones, compromisos de inversionistas, calendario de cuotas, registro de pagos, reportes y gráficos.

### Fase 5 — Automatización
Lectura de avalúos, generación de fichas y PDF, WhatsApp Business, firma electrónica, integraciones fiduciarias.

## Pendientes del lado de Trust Capital

- Texto legal definitivo del acuerdo de intermediación, términos y privacidad (se carga desde el panel admin; mientras tanto, texto provisional marcado como borrador).
- Archivos oficiales de branding (logo, colores). Mientras tanto, sistema provisional configurable.
- Evento contractual que define el **devengo** de la comisión del broker (p. ej. desembolso efectivo, cobro de la comisión). El sistema lo deja configurable.
- Revisión legal de obligaciones regulatorias aplicables (ver `SECURITY.md`).

## Alertas detectadas en los casos históricos

- **Caso 7 (Peñas Blancas):** US$2.000.000 sobre avalúo de US$2.070.456 → LTV ≈ 96,6 %. Supera el objetivo de 50 %; debe mostrar alerta.
- **Caso 8 (Hotel Manuel Antonio):** US$4,5–6 M supera el rango habitual de US$3,5 M; alerta de política.
- **Casos 4 y 5 (Lagunas de Barú):** se mantienen como expedientes separados hasta confirmar si son la misma solicitud.
- **Caso 14:** comisión histórica fuera del 50/50; se registra como excepción pendiente de revisión contractual.
- **Casos 13 y 17:** no publicables (revisión legal / cancelado).
