# DATABASE — Trust Capital Marketplace

PostgreSQL (Supabase). Todas las tablas en `public` con **RLS activado**. Claves primarias `uuid` (`gen_random_uuid()`), `created_at`/`updated_at` con trigger.

## Convenciones

- Dinero: `numeric(14,2)` + `currency char(3) default 'USD'`.
- Tasas y porcentajes: `numeric(7,4)` (12 % = `12.0000`).
- Borrado: nunca físico en datos financieros o de expedientes; se usa `status` (`cancelled`, `archived`, `voided`).
- Datos dudosos: columna `verification_status` (`unverified`, `pending`, `verified`, `rejected`).
- Históricos: `is_historical boolean`, `legacy_code text` (p. ej. `HIST-07`).

## Enums principales

```
app_role               ADMIN | BROKER | INVESTOR | BORROWER
person_type            individual | company
broker_status          pending | approved | suspended | rejected
application_status     draft | submitted | in_review | info_pending | preapproved |
                       seeking_investor | negotiating | formalizing | disbursed |
                       rejected | cancelled | suspended | archived
analysis_status        not_started | documents | collateral | financial | legal | completed
publication_status     not_ready | draft | published | unpublished
legal_status           not_started | in_review | approved | observations
commission_status      estimated | pending_accrual | accrued | approved |
                       partially_paid | paid | adjusted | voided
payment_status         registered | confirmed | reversed
document_review_status pending | approved | rejected | expired
interest_status        submitted | info_requested | contacted | confirmed | declined | withdrawn
```

## Identidad

| Tabla | Propósito | Campos clave |
|---|---|---|
| `profiles` | 1:1 con `auth.users` | `id` (= auth uid), `full_name`, `email`, `phone`, `country`, `person_type`, `primary_role`, `terms_accepted_at`, `privacy_accepted_at` |
| `user_roles` | Roles del usuario | `user_id`, `role app_role`, único (`user_id`,`role`) |
| `organizations` / `organization_members` | Personas jurídicas y sus representantes | `legal_name`, `tax_id`; `role_in_org` |
| `verification_records` | KYC progresivo | `user_id`, `kind`, `status`, `reviewed_by`, `document_id` |
| `investor_preferences` | Perfil de inversión | capital disponible, mín/máx, tasa mínima, plazo máximo, LTV máximo, provincias[], tipos de propiedad[], tipos de garantía[], tolerancia al riesgo |

## Originación

| Tabla | Propósito |
|---|---|
| `brokers` | Perfil del broker: empresa, cédula, provincia, WhatsApp, experiencia, datos de pago, `status broker_status`, `approved_by/at` |
| `borrowers` | Solicitante (persona o empresa): identificación, representante legal, actividad, ubicación. Puede estar ligado a un usuario o ser creado por un broker |
| `loan_applications` | Expediente: monto, moneda, plazo, tasa propuesta, uso de fondos, fuente de repago, fecha requerida, deudas, `status`, `analysis_status`, `legal_status`, `origin` (`broker` / `borrower` / `admin`), `created_by`, `assigned_to`, `submitted_at`, `is_historical`, `verification_status` |
| `application_brokers` | Broker originador del caso (1 por expediente). Se fija al enviar; cambios solo por admin con motivo registrado |
| `properties` | Garantía: tipo, provincia, cantón, finca, plano, propietario, áreas, observaciones |
| `property_valuations` | Valor comercial, avalúo, venta rápida, fecha, perito, `is_accepted`. Un solo valor aceptado vigente por propiedad |
| `property_liens` | Hipotecas y gravámenes |
| `application_collateral` | N:M expediente ↔ propiedades, con grado de hipoteca |
| `application_documents` | Archivo en Storage: categoría, `storage_path`, versión, `review_status`, vencimiento, `uploaded_by` |
| `application_status_history` | Cada cambio de estado: anterior, nuevo, dimensión, motivo, usuario |

## Acuerdos y comisiones

| Tabla | Propósito |
|---|---|
| `agreement_versions` | Texto del acuerdo cargado por admin: `kind` (`broker_intermediation`, `terms`, `privacy`), `version`, `body`, `body_hash`, `is_active`, `is_draft_legal` |
| `broker_agreements` | Evidencia de aceptación: `broker_id`, `agreement_version_id`, `accepted_at`, `ip`, `user_agent`, `body_hash` (inmutable, sin UPDATE/DELETE) |
| `commission_agreements` | Términos de reparto por broker: `trust_capital_share_percentage` (50), `broker_share_percentage` (50), `agreement_status`, `is_exception`, `approved_by`, `document_reference`. Check: suma = 100 |
| `case_commissions` | Una por expediente con broker: `commercial_commission_rate/amount`, `trust_capital_received_amount`, `distributable_commission_amount`, `broker_share_percentage`, `trust_capital_share_amount`, `broker_share_amount`, `approved_amount`, `paid_amount`, `status`, `currency` |
| `commission_payments` | Pagos al broker: monto, fecha, referencia, comprobante, `status` |
| `commission_events` | Bitácora: tipo de evento, valor anterior, valor nuevo, usuario |

### Reglas implementadas en la BD

1. **Reparto automático** (trigger `before insert/update` en `case_commissions`):
   `broker_share_amount = round(distributable × broker_pct / 100, 2)`
   `trust_capital_share_amount = distributable − broker_share_amount`.
   Ningún cliente puede escribir esos dos campos directamente.
2. `distributable_commission_amount ≤ trust_capital_received_amount` (check).
3. **Sin sobrepago**: trigger en `commission_payments` rechaza si `sum(pagos confirmados) + nuevo > approved_amount`.
4. `approved_amount ≤ broker_share_amount` salvo excepción aprobada.
5. Estado `accrued` solo se alcanza cuando el admin registra el evento de devengo; nunca por aprobar o publicar un caso.
6. `paid_amount` y estado `partially_paid` / `paid` se recalculan desde los pagos.
7. Todo cambio escribe en `commission_events` (trigger).
8. **No existen** tablas de referidores, niveles ni repartos secundarios.

## Marketplace

| Tabla | Propósito |
|---|---|
| `investment_opportunities` | Copia **curada** del expediente aprobada para publicar: título, ubicación general, tipo de propiedad, monto, valor aceptado, LTV, tasa, plazo, descripción, riesgos, `publication_status`, `published_at/by`, `version` |
| `opportunity_media` / `opportunity_documents` | Fotos y documentos expresamente autorizados |
| `opportunity_favorites` | Favoritos del inversionista |
| `investment_interests` | Manifestación de interés: monto indicativo, mensaje, `status`. No es inversión |
| `investor_access_grants` | Qué inversionistas están autorizados al marketplace o a documentos específicos |

## Financiamiento

`financing_operations`, `investor_commitments` (check: suma ≤ monto aprobado), `loan_terms`, `payment_schedules`, `payment_records`, `guarantees`.

## Administración

| Tabla | Propósito |
|---|---|
| `system_settings` | Parámetros comerciales: tasa de referencia (12), LTV objetivo (50), rango de montos (50.000–3.500.000), plazos (12–24), comisión comercial ref. (5), gastos (2–2,5). Versionados por `effective_from`; no afectan operaciones formalizadas |
| `notifications` | Notificaciones internas (sin datos sensibles en el texto) |
| `audit_logs` | Trigger genérico: tabla, id, acción, `old`/`new` (jsonb), usuario, fecha |
| `document_access_logs` | Cada URL firmada emitida: usuario, documento, fecha |

## Resumen de RLS

| Recurso | ADMIN | BROKER | BORROWER | INVESTOR |
|---|---|---|---|---|
| `profiles` | todo | el propio | el propio | el propio |
| `loan_applications` | todo | los que originó | los suyos | ✗ |
| `application_documents` | todo | de sus casos | de sus solicitudes | ✗ |
| `case_commissions` | todo | solo las suyas (lectura) | ✗ | ✗ |
| `commission_payments` | todo | solo los suyos (lectura) | ✗ | ✗ |
| `investment_opportunities` | todo | ✗ | ✗ | solo `published` y con acceso autorizado |
| `investment_interests` | todo | ✗ | ✗ | los propios |
| `audit_logs`, `system_settings` (escritura) | todo | ✗ | ✗ | ✗ |

Funciones auxiliares `security definer` con `search_path` fijo: `has_role(role)`, `is_admin()` (exige `aal2`), `is_broker_of(application_id)`, `owns_application(application_id)`.

## Orden de migraciones

1. `0001_foundation` — extensiones, enums, `profiles`, `user_roles`, helpers, trigger de alta de usuario, `audit_logs`, `system_settings`.
2. `0002_origination` — brokers, borrowers, solicitudes, propiedades, documentos, historial.
3. `0003_agreements_commissions` — acuerdos y comisiones con triggers.
4. `0004_marketplace` — oportunidades, intereses, accesos.
5. `0005_operations` — operaciones, compromisos, cuotas, pagos.
6. `0006_storage` — buckets privados y políticas.
