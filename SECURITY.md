# SECURITY — Trust Capital Marketplace

## Principios

1. **Mínimo privilegio.** Cada rol ve solo lo que necesita; la BD lo hace cumplir con RLS.
2. **Defensa en capas.** Guardas en middleware → validación y autorización en Server Actions → RLS y triggers en PostgreSQL.
3. **Privado por defecto.** Documentos, expedientes y comisiones son privados hasta que el admin autorice lo contrario.
4. **Todo deja rastro.** Cambios administrativos, aceptaciones contractuales, cambios de estado y accesos a documentos quedan registrados.

## Autenticación

- Supabase Auth con correo y contraseña; confirmación de correo obligatoria antes de entrar a `/app`.
- Contraseñas: mínimo 10 caracteres, verificación contra filtraciones (opción *leaked password protection* de Supabase).
- Sesión en cookies `httpOnly`, `secure`, `sameSite=lax`; refresco en middleware; validación con `auth.getUser()` en servidor.
- **MFA TOTP obligatorio para ADMIN.** Rutas admin y políticas RLS admin exigen `aal2`.
- Recuperación de contraseña con enlace de un solo uso.

## Autorización

- Toda escritura pasa por Server Actions que: (1) validan con Zod, (2) verifican el rol, (3) ejecutan con el cliente del usuario para que aplique RLS.
- `SUPABASE_SERVICE_ROLE_KEY` solo en el servidor, solo para tareas administrativas acotadas (p. ej. asignar rol al registrarse), nunca importado en componentes cliente.
- Campos sensibles protegidos por triggers además de RLS: broker originador, reparto de comisión, montos aprobados, estado de publicación.
- Un broker no puede cambiar su propio estado de aprobación; un usuario no puede asignarse roles (`user_roles` solo escribible por admin o por la función de alta controlada).

## Documentos (Storage)

- Buckets **privados**: `application-documents`, `opportunity-media`, `commission-proofs`, `kyc`.
- Ruta: `{application_id}/{category}/{uuid}-{nombre-saneado}`.
- Validación de tipo (PDF, JPG, PNG, WEBP, DOCX, XLSX) por *magic bytes* y extensión; tamaño máximo 20 MB.
- Acceso solo mediante **URLs firmadas de 60 segundos**, emitidas por el servidor tras verificar permisos; cada emisión se registra en `document_access_logs`.
- Fotos de oportunidades publicadas: URLs firmadas de vida más larga (1 h) solo para inversionistas autorizados.

## Protección de la aplicación

- Rate limiting: límites nativos de Supabase Auth + límite por IP en acciones sensibles (registro, recuperación, subida de archivos, manifestación de interés).
- Cabeceras: CSP estricta, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, HSTS.
- Sin datos personales en URLs, query strings ni logs.
- Notificaciones y correos sin montos, identificaciones ni datos de garantías; solo un aviso y enlace a la plataforma.
- Dependencias mínimas; auditoría con `npm audit` en CI.

## Auditoría y trazabilidad

- `audit_logs`: trigger en expedientes, comisiones, pagos, oportunidades, roles, configuración.
- `broker_agreements` es **append-only** (sin UPDATE ni DELETE, ni siquiera para admin).
- Historial financiero nunca se borra; correcciones = nuevo evento + ajuste.

## Datos y privacidad

- KYC progresivo: el registro inicial no pide documentos sensibles.
- Entornos de prueba solo con datos demostrativos; los casos históricos se cargan sin cédulas, números de finca ni nombres reales de personas físicas.
- Copias de seguridad: backups diarios de Supabase; para producción evaluar *Point-in-Time Recovery*.
- Política de conservación y derecho de acceso/rectificación a definir con asesoría legal.

## Cumplimiento (pendiente de revisión legal)

La plataforma **no** asume licencias ni autorizaciones regulatorias que no estén verificadas. Antes de producción, Trust Capital debe validar con su asesor legal, entre otros:

- Protección de datos personales: **Ley 8968** y su reglamento (PRODHAB), incluyendo consentimiento informado y posible inscripción de bases de datos.
- Prevención de legitimación de capitales: **Ley 7786** y si la actividad requiere inscripción ante SUGEF; políticas KYC/beneficiario final.
- Régimen aplicable a la intermediación de crédito privado y a la oferta de oportunidades a inversionistas (riesgo de que se interprete como oferta pública o captación).
- Textos de términos, privacidad, acuerdo de intermediación y avisos de riesgo.

Mensajes que la plataforma **nunca** muestra: rendimientos garantizados, aprobación garantizada, que Trust Capital sea banco o capte depósitos.
