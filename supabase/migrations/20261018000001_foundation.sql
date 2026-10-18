-- =====================================================================
-- Trust Capital Marketplace — 0001 Fundamentos
-- Identidad, roles, perfiles por rol, consentimientos, configuración,
-- notificaciones y auditoría. RLS activo en todas las tablas.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------
create type public.app_role as enum ('ADMIN', 'BROKER', 'INVESTOR', 'BORROWER');
create type public.person_type as enum ('individual', 'company');
create type public.broker_status as enum ('pending', 'approved', 'suspended', 'rejected');
create type public.verification_status as enum ('unverified', 'pending', 'verified', 'rejected');
create type public.agreement_kind as enum ('terms', 'privacy', 'broker_intermediation');

-- ---------------------------------------------------------------------
-- Utilidades
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- Perfiles y roles
-- ---------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null check (char_length(full_name) between 2 and 160),
  email text not null,
  phone text check (phone is null or char_length(phone) <= 40),
  country text not null default 'CR' check (char_length(country) between 2 and 60),
  person_type public.person_type not null default 'individual',
  primary_role public.app_role,
  terms_accepted_at timestamptz,
  privacy_accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.profiles is 'Perfil 1:1 con auth.users. Se crea por trigger al registrarse.';

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  role public.app_role not null,
  granted_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
create index user_roles_user_idx on public.user_roles (user_id);
comment on table public.user_roles is 'Roles asignados. Solo el alta controlada (trigger) o un ADMIN pueden escribir.';

-- ---------------------------------------------------------------------
-- Funciones de autorización (security definer, search_path fijo)
-- ---------------------------------------------------------------------
create or replace function public.has_role(check_role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.user_roles ur
    where ur.user_id = (select auth.uid()) and ur.role = check_role
  );
$$;

-- ADMIN con MFA verificado en la sesión actual (nivel aal2).
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.has_role('ADMIN')
     and coalesce((select auth.jwt()) ->> 'aal', 'aal1') = 'aal2';
$$;

revoke execute on function public.has_role(public.app_role) from public, anon;
revoke execute on function public.is_admin() from public, anon;
grant execute on function public.has_role(public.app_role) to authenticated;
grant execute on function public.is_admin() to authenticated;

-- ---------------------------------------------------------------------
-- Organizaciones (personas jurídicas)
-- ---------------------------------------------------------------------
create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  legal_name text not null,
  tax_id text,
  country text not null default 'CR',
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger organizations_updated_at before update on public.organizations
  for each row execute function public.set_updated_at();

create table public.organization_members (
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role_in_org text not null default 'representative',
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

create table public.verification_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null,
  status public.verification_status not null default 'pending',
  notes text,
  reviewed_by uuid references public.profiles (id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
create index verification_records_user_idx on public.verification_records (user_id);

-- ---------------------------------------------------------------------
-- Perfiles por rol
-- ---------------------------------------------------------------------
create table public.brokers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles (id) on delete cascade,
  first_name text not null,
  last_name text not null,
  company_name text,
  tax_id text,
  country text not null default 'CR',
  province text,
  whatsapp text,
  experience_years integer check (experience_years is null or experience_years between 0 and 80),
  experience_summary text check (experience_summary is null or char_length(experience_summary) <= 2000),
  status public.broker_status not null default 'pending',
  status_reason text,
  approved_by uuid references public.profiles (id),
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index brokers_status_idx on public.brokers (status);
create trigger brokers_updated_at before update on public.brokers
  for each row execute function public.set_updated_at();

create table public.borrowers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references public.profiles (id) on delete set null,
  created_by uuid references public.profiles (id),
  person_type public.person_type not null default 'individual',
  legal_name text not null,
  identification text,
  legal_representative text,
  email text,
  phone text,
  economic_activity text,
  country text not null default 'CR',
  province text,
  business_description text,
  verification_status public.verification_status not null default 'unverified',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index borrowers_created_by_idx on public.borrowers (created_by);
create trigger borrowers_updated_at before update on public.borrowers
  for each row execute function public.set_updated_at();
comment on table public.borrowers is 'Solicitante (persona o empresa). Puede estar ligado a un usuario o haber sido registrado por un broker.';

create table public.investor_preferences (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  nationality text,
  residence_country text,
  available_capital numeric(14,2) check (available_capital is null or available_capital >= 0),
  min_investment numeric(14,2) check (min_investment is null or min_investment >= 0),
  max_investment numeric(14,2) check (max_investment is null or max_investment >= 0),
  currency char(3) not null default 'USD',
  min_rate_pct numeric(7,4) check (min_rate_pct is null or min_rate_pct between 0 and 100),
  max_term_months integer check (max_term_months is null or max_term_months between 1 and 600),
  max_ltv_pct numeric(7,4) check (max_ltv_pct is null or max_ltv_pct between 0 and 100),
  preferred_provinces text[] not null default '{}',
  property_types text[] not null default '{}',
  guarantee_types text[] not null default '{}',
  experience text,
  payment_preference text,
  prepayment_conditions text,
  risk_tolerance text check (risk_tolerance is null or risk_tolerance in ('low', 'medium', 'high')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (min_investment is null or max_investment is null or min_investment <= max_investment)
);
create trigger investor_preferences_updated_at before update on public.investor_preferences
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- Acuerdos versionados y consentimientos
-- ---------------------------------------------------------------------
create table public.agreement_versions (
  id uuid primary key default gen_random_uuid(),
  kind public.agreement_kind not null,
  version text not null,
  title text not null,
  body text not null,
  body_hash text not null,
  is_active boolean not null default false,
  is_legal_draft boolean not null default true,
  published_at timestamptz,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  unique (kind, version)
);
create unique index agreement_versions_one_active on public.agreement_versions (kind) where is_active;
comment on column public.agreement_versions.is_legal_draft is 'true mientras el texto no haya pasado revisión legal.';

create or replace function public.agreement_versions_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' and (new.body is distinct from old.body or new.version is distinct from old.version or new.kind is distinct from old.kind) then
    raise exception 'El texto de una versión de acuerdo es inmutable; cree una versión nueva.';
  end if;
  new.body_hash := encode(sha256(convert_to(new.body, 'UTF8')), 'hex');
  if new.is_active and new.published_at is null then
    new.published_at := now();
  end if;
  return new;
end;
$$;
create trigger agreement_versions_guard before insert or update on public.agreement_versions
  for each row execute function public.agreement_versions_guard();

create table public.consent_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  agreement_version_id uuid not null references public.agreement_versions (id),
  kind public.agreement_kind not null,
  body_hash text not null,
  accepted_at timestamptz not null default now(),
  ip text,
  user_agent text
);
create index consent_records_user_idx on public.consent_records (user_id);
comment on table public.consent_records is 'Evidencia de aceptación (append-only). No admite UPDATE ni DELETE.';

create or replace function public.prevent_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'Registro inmutable: % no admite %', tg_table_name, tg_op;
end;
$$;
create trigger consent_records_immutable before update or delete on public.consent_records
  for each row execute function public.prevent_mutation();

-- ---------------------------------------------------------------------
-- Configuración, notificaciones, auditoría
-- ---------------------------------------------------------------------
create table public.system_settings (
  id uuid primary key default gen_random_uuid(),
  key text not null,
  value jsonb not null,
  description text,
  effective_from timestamptz not null default now(),
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  unique (key, effective_from)
);
comment on table public.system_settings is 'Parámetros versionados por fecha de vigencia. Nunca se editan: se agrega una versión nueva.';

create view public.current_settings with (security_invoker = true) as
  select distinct on (key) key, value, description, effective_from
  from public.system_settings
  where effective_from <= now()
  order by key, effective_from desc;

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null,
  title text not null,
  body text,
  link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_user_idx on public.notifications (user_id, created_at desc);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  table_name text not null,
  record_id text,
  action text not null,
  old_data jsonb,
  new_data jsonb,
  actor_id uuid,
  created_at timestamptz not null default now()
);
create index audit_logs_table_idx on public.audit_logs (table_name, record_id);
create index audit_logs_created_idx on public.audit_logs (created_at desc);

create or replace function public.audit_trigger()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  rec_id text;
begin
  rec_id := coalesce(
    case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end ->> 'id',
    case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end ->> 'user_id'
  );
  insert into public.audit_logs (table_name, record_id, action, old_data, new_data, actor_id)
  values (
    tg_table_name,
    rec_id,
    tg_op,
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end,
    case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end,
    (select auth.uid())
  );
  return coalesce(new, old);
end;
$$;

create trigger audit_profiles after update on public.profiles for each row execute function public.audit_trigger();
create trigger audit_user_roles after insert or update or delete on public.user_roles for each row execute function public.audit_trigger();
create trigger audit_brokers after insert or update or delete on public.brokers for each row execute function public.audit_trigger();
create trigger audit_agreement_versions after insert or update on public.agreement_versions for each row execute function public.audit_trigger();
create trigger audit_consent_records after insert on public.consent_records for each row execute function public.audit_trigger();
create trigger audit_system_settings after insert or update or delete on public.system_settings for each row execute function public.audit_trigger();

-- ---------------------------------------------------------------------
-- Alta de usuario: perfil + rol + perfil por rol + consentimientos
-- Nunca asigna ADMIN desde los metadatos del registro.
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  req_role text := upper(coalesce(meta ->> 'requested_role', ''));
  role_value public.app_role;
  terms_id uuid;
  privacy_id uuid;
  terms_hash text;
  privacy_hash text;
  ptype public.person_type := case when meta ->> 'person_type' = 'company' then 'company'::public.person_type else 'individual'::public.person_type end;
begin
  if req_role in ('BROKER', 'INVESTOR', 'BORROWER') then
    role_value := req_role::public.app_role;
  end if;

  insert into public.profiles (id, full_name, email, phone, country, person_type, primary_role)
  values (
    new.id,
    coalesce(nullif(trim(meta ->> 'full_name'), ''), split_part(new.email, '@', 1)),
    new.email,
    nullif(trim(meta ->> 'phone'), ''),
    coalesce(nullif(trim(meta ->> 'country'), ''), 'CR'),
    ptype,
    role_value
  );

  if role_value is null then
    return new; -- usuario creado manualmente (p. ej. administrador); sin rol hasta asignación
  end if;

  -- Consentimientos obligatorios: deben corresponder a las versiones activas.
  select id, body_hash into terms_id, terms_hash from public.agreement_versions
    where kind = 'terms' and is_active and id = nullif(meta ->> 'terms_version_id', '')::uuid;
  select id, body_hash into privacy_id, privacy_hash from public.agreement_versions
    where kind = 'privacy' and is_active and id = nullif(meta ->> 'privacy_version_id', '')::uuid;
  if terms_id is null or privacy_id is null then
    raise exception 'Debe aceptar los términos y la política de privacidad vigentes.' using errcode = 'P0001';
  end if;

  insert into public.consent_records (user_id, agreement_version_id, kind, body_hash, ip, user_agent)
  values
    (new.id, terms_id, 'terms', terms_hash, left(meta ->> 'consent_ip', 64), left(meta ->> 'consent_user_agent', 512)),
    (new.id, privacy_id, 'privacy', privacy_hash, left(meta ->> 'consent_ip', 64), left(meta ->> 'consent_user_agent', 512));

  update public.profiles set terms_accepted_at = now(), privacy_accepted_at = now() where id = new.id;

  insert into public.user_roles (user_id, role) values (new.id, role_value);

  if role_value = 'BROKER' then
    insert into public.brokers (user_id, first_name, last_name, company_name, tax_id, country, province, whatsapp, experience_years, experience_summary)
    values (
      new.id,
      coalesce(nullif(trim(meta ->> 'first_name'), ''), split_part(coalesce(meta ->> 'full_name', ''), ' ', 1)),
      coalesce(nullif(trim(meta ->> 'last_name'), ''), ''),
      nullif(trim(meta ->> 'company_name'), ''),
      nullif(trim(meta ->> 'tax_id'), ''),
      coalesce(nullif(trim(meta ->> 'country'), ''), 'CR'),
      nullif(trim(meta ->> 'province'), ''),
      nullif(trim(meta ->> 'whatsapp'), ''),
      nullif(meta ->> 'experience_years', '')::integer,
      nullif(trim(meta ->> 'experience_summary'), '')
    );
  elsif role_value = 'BORROWER' then
    insert into public.borrowers (user_id, created_by, person_type, legal_name, identification, email, phone, economic_activity, country, province)
    values (
      new.id, new.id, ptype,
      coalesce(nullif(trim(meta ->> 'legal_name'), ''), nullif(trim(meta ->> 'full_name'), ''), split_part(new.email, '@', 1)),
      nullif(trim(meta ->> 'identification'), ''),
      new.email,
      nullif(trim(meta ->> 'phone'), ''),
      nullif(trim(meta ->> 'economic_activity'), ''),
      coalesce(nullif(trim(meta ->> 'country'), ''), 'CR'),
      nullif(trim(meta ->> 'province'), '')
    );
  elsif role_value = 'INVESTOR' then
    insert into public.investor_preferences (
      user_id, nationality, residence_country, available_capital, min_investment, max_investment,
      min_rate_pct, max_term_months, max_ltv_pct, preferred_provinces, guarantee_types, experience, payment_preference
    )
    values (
      new.id,
      nullif(trim(meta ->> 'nationality'), ''),
      nullif(trim(meta ->> 'residence_country'), ''),
      nullif(meta ->> 'available_capital', '')::numeric,
      nullif(meta ->> 'min_investment', '')::numeric,
      nullif(meta ->> 'max_investment', '')::numeric,
      nullif(meta ->> 'min_rate_pct', '')::numeric,
      nullif(meta ->> 'max_term_months', '')::integer,
      nullif(meta ->> 'max_ltv_pct', '')::numeric,
      coalesce(array(select jsonb_array_elements_text(coalesce(meta -> 'preferred_provinces', '[]'::jsonb))), '{}'),
      coalesce(array(select jsonb_array_elements_text(coalesce(meta -> 'guarantee_types', '[]'::jsonb))), '{}'),
      nullif(trim(meta ->> 'experience'), ''),
      nullif(trim(meta ->> 'payment_preference'), '')
    );
  end if;

  insert into public.notifications (user_id, kind, title, body, link)
  values (new.id, 'registration', 'Bienvenido a Trust Capital', 'Tu cuenta fue creada correctamente.', '/app');

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Mantiene el correo del perfil sincronizado si el usuario lo cambia en Auth.
create or replace function public.handle_user_email_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles set email = new.email where id = new.id;
  return new;
end;
$$;
create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row when (old.email is distinct from new.email)
  execute function public.handle_user_email_change();

-- ---------------------------------------------------------------------
-- Funciones administrativas controladas
-- ---------------------------------------------------------------------
create or replace function public.mark_notification_read(notification_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.notifications set read_at = coalesce(read_at, now())
  where id = notification_id and user_id = (select auth.uid());
$$;
revoke execute on function public.mark_notification_read(uuid) from public, anon;
grant execute on function public.mark_notification_read(uuid) to authenticated;

create or replace function public.mark_all_notifications_read()
returns void
language sql
security definer
set search_path = ''
as $$
  update public.notifications set read_at = now()
  where user_id = (select auth.uid()) and read_at is null;
$$;
revoke execute on function public.mark_all_notifications_read() from public, anon;
grant execute on function public.mark_all_notifications_read() to authenticated;

-- ---------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.verification_records enable row level security;
alter table public.brokers enable row level security;
alter table public.borrowers enable row level security;
alter table public.investor_preferences enable row level security;
alter table public.agreement_versions enable row level security;
alter table public.consent_records enable row level security;
alter table public.system_settings enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;

-- Privilegios de tabla: anon no toca datos privados; authenticated solo columnas editables.
revoke all on public.profiles, public.user_roles, public.organizations, public.organization_members,
  public.verification_records, public.brokers, public.borrowers, public.investor_preferences,
  public.consent_records, public.system_settings, public.notifications, public.audit_logs
  from anon;
revoke insert, update, delete on public.agreement_versions from anon;
revoke all on public.current_settings from anon;

revoke insert, update, delete on public.profiles from authenticated;
grant update (full_name, phone, country, person_type) on public.profiles to authenticated;

revoke update on public.brokers from authenticated;
grant update (first_name, last_name, company_name, province, whatsapp, experience_years, experience_summary) on public.brokers to authenticated;
revoke insert, delete on public.brokers from authenticated;

revoke update on public.borrowers from authenticated;
grant update (legal_name, legal_representative, phone, economic_activity, province, business_description) on public.borrowers to authenticated;
revoke delete on public.borrowers from authenticated;

revoke insert, delete on public.investor_preferences from authenticated;

revoke insert, update, delete on public.consent_records from authenticated;
revoke insert, update, delete on public.audit_logs from authenticated;
revoke update, delete on public.notifications from authenticated;

-- profiles
create policy "profiles: leer el propio" on public.profiles for select to authenticated
  using (id = (select auth.uid()) or public.is_admin());
create policy "profiles: editar el propio" on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- user_roles
create policy "user_roles: leer los propios" on public.user_roles for select to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());
create policy "user_roles: admin asigna" on public.user_roles for insert to authenticated
  with check (public.is_admin());
create policy "user_roles: admin revoca" on public.user_roles for delete to authenticated
  using (public.is_admin() and user_id <> (select auth.uid()));

-- organizations
create policy "organizations: miembros y admin" on public.organizations for select to authenticated
  using (public.is_admin() or exists (
    select 1 from public.organization_members m where m.organization_id = organizations.id and m.user_id = (select auth.uid())));
create policy "organizations: admin escribe" on public.organizations for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "organization_members: propios y admin" on public.organization_members for select to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());
create policy "organization_members: admin escribe" on public.organization_members for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- verification_records
create policy "verification_records: propios y admin" on public.verification_records for select to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());
create policy "verification_records: admin escribe" on public.verification_records for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- brokers
create policy "brokers: leer el propio" on public.brokers for select to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());
create policy "brokers: editar el propio" on public.brokers for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- borrowers
create policy "borrowers: leer el propio" on public.borrowers for select to authenticated
  using (user_id = (select auth.uid()) or created_by = (select auth.uid()) or public.is_admin());
create policy "borrowers: editar el propio" on public.borrowers for update to authenticated
  using (user_id = (select auth.uid()) or created_by = (select auth.uid()))
  with check (user_id = (select auth.uid()) or created_by = (select auth.uid()));

-- investor_preferences
create policy "investor_preferences: leer las propias" on public.investor_preferences for select to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());
create policy "investor_preferences: editar las propias" on public.investor_preferences for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- agreement_versions (las versiones activas son públicas: términos y privacidad)
create policy "agreement_versions: activas son públicas" on public.agreement_versions for select to anon
  using (is_active);
create policy "agreement_versions: activas y admin" on public.agreement_versions for select to authenticated
  using (is_active or public.is_admin());
create policy "agreement_versions: admin crea" on public.agreement_versions for insert to authenticated
  with check (public.is_admin());
create policy "agreement_versions: admin activa" on public.agreement_versions for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- consent_records
create policy "consent_records: leer los propios" on public.consent_records for select to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());

-- system_settings
create policy "system_settings: lectura autenticada" on public.system_settings for select to authenticated
  using (true);
create policy "system_settings: admin agrega versión" on public.system_settings for insert to authenticated
  with check (public.is_admin());

-- notifications
create policy "notifications: leer las propias" on public.notifications for select to authenticated
  using (user_id = (select auth.uid()));
create policy "notifications: admin crea" on public.notifications for insert to authenticated
  with check (public.is_admin());

-- audit_logs
create policy "audit_logs: solo admin" on public.audit_logs for select to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------
-- Datos iniciales
-- ---------------------------------------------------------------------
insert into public.system_settings (key, value, description, effective_from) values
  ('reference_annual_rate_pct', '12', 'Tasa anual de referencia', '2026-01-01'),
  ('alternative_rates_pct', '[10, 14, 15]', 'Otras tasas habituales', '2026-01-01'),
  ('target_max_ltv_pct', '50', 'LTV objetivo máximo', '2026-01-01'),
  ('amount_range_usd', '{"min": 50000, "max": 3500000}', 'Montos habituales', '2026-01-01'),
  ('term_range_months', '{"min": 12, "max": 24}', 'Plazos habituales', '2026-01-01'),
  ('reference_commercial_commission_pct', '5', 'Comisión comercial de referencia al cliente', '2026-01-01'),
  ('legal_admin_expenses_pct', '{"min": 2, "max": 2.5}', 'Gastos legales y administrativos aproximados', '2026-01-01'),
  ('default_broker_share_pct', '50', 'Participación del broker sobre la comisión elegible recibida', '2026-01-01'),
  ('preliminary_review_target_hours', '48', 'Objetivo de evaluación preliminar', '2026-01-01'),
  ('disbursement_target_business_days', '15', 'Objetivo de desembolso', '2026-01-01');

insert into public.agreement_versions (kind, version, title, body, is_active, is_legal_draft) values
('terms', '0.1-borrador', 'Términos y condiciones de uso',
$t$BORRADOR PENDIENTE DE REVISIÓN LEGAL. Este texto es provisional y será reemplazado por la versión aprobada por la asesoría legal de Trust Capital.

1. Objeto. Trust Capital Marketplace es una plataforma privada que facilita la conexión entre solicitantes de financiamiento, brokers e inversionistas privados en operaciones de crédito respaldadas principalmente por garantías inmobiliarias.

2. Naturaleza del servicio. Trust Capital no es un banco, no capta depósitos del público y no garantiza rendimientos, aprobaciones ni desembolsos. Toda información financiera mostrada antes de la formalización es una estimación.

3. Acceso. El acceso a oportunidades está sujeto a autorización de Trust Capital. La manifestación de interés de un inversionista no constituye una inversión formalizada.

4. Responsabilidad del usuario. El usuario declara que la información que aporta es veraz y se compromete a mantenerla actualizada.

5. Confidencialidad. La información de expedientes y oportunidades es confidencial y solo puede usarse para evaluar la operación correspondiente.

6. Modificaciones. Trust Capital podrá actualizar estos términos; las nuevas versiones requerirán aceptación cuando corresponda.$t$, true, true),
('privacy', '0.1-borrador', 'Política de privacidad',
$p$BORRADOR PENDIENTE DE REVISIÓN LEGAL. Texto provisional sujeto a revisión conforme a la Ley 8968 de Protección de la Persona frente al Tratamiento de sus Datos Personales.

1. Responsable. Trust Capital es responsable del tratamiento de los datos personales recopilados en la plataforma.

2. Finalidad. Los datos se utilizan para gestionar el registro, evaluar solicitudes de financiamiento, verificar identidad, cumplir obligaciones legales y de prevención de legitimación de capitales, y comunicarse con el usuario.

3. Datos tratados. Datos de identificación y contacto, información financiera y de garantías aportada voluntariamente, y registros de uso de la plataforma.

4. Acceso restringido. Los documentos se almacenan de forma privada y solo los usuarios autorizados pueden consultarlos. Cada acceso queda registrado.

5. Derechos. El usuario puede ejercer sus derechos de acceso, rectificación y supresión mediante los canales oficiales de Trust Capital.

6. Conservación. Los datos se conservan durante el tiempo necesario para las finalidades indicadas y las obligaciones legales aplicables.$p$, true, true),
('broker_intermediation', '0.1-borrador', 'Acuerdo de intermediación para brokers',
$b$BORRADOR PENDIENTE DE REVISIÓN LEGAL. El texto contractual definitivo será cargado por Trust Capital tras su revisión legal.

1. Distribución de comisión. La comisión efectivamente recibida por Trust Capital por una operación y elegible para reparto se distribuirá 50 % para Trust Capital y 50 % para el broker originador del caso.

2. Base de cálculo. El reparto se calcula exclusivamente sobre la comisión recibida por Trust Capital y elegible para distribución, considerando los ajustes, impuestos o retenciones aplicables. No se calcula sobre la comisión comercial total cobrada al cliente.

3. Devengo. La comisión del broker se devenga únicamente cuando se cumple el evento definido en el acuerdo aplicable. La aprobación o publicación de un caso no genera una comisión pagadera.

4. Pago. La comisión devengada y aprobada se pagará conforme a las condiciones del acuerdo firmado. Se admiten pagos parciales.

5. Referidores. Si el broker trabaja con otros brokers, agentes, comisionistas o referidores, será el único responsable de negociar y pagar sus comisiones, que saldrán exclusivamente de su 50 %. Trust Capital no tiene obligación de pago frente a dichos terceros.

6. Sin garantía de resultado. Trust Capital no garantiza que una solicitud será aprobada o financiada.

7. Confidencialidad. El broker mantendrá la confidencialidad de la información de clientes, inversionistas y operaciones.

8. No circunvención. El broker no podrá eludir a Trust Capital para cerrar operaciones con inversionistas o clientes presentados a través de la plataforma, conforme al acuerdo aplicable.

9. Terminación. Cualquiera de las partes podrá terminar la relación conforme a las condiciones del acuerdo firmado, sin afectar comisiones ya devengadas.

10. Operaciones no formalizadas. Las operaciones que no lleguen a formalizarse no generan comisión.$b$, true, true);
