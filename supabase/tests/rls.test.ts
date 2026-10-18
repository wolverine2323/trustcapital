/**
 * Pruebas de seguridad de la base de datos (RLS, privilegios y triggers).
 * Se ejecutan contra un PostgreSQL en memoria (PGlite) con un stub mínimo de Supabase Auth.
 */
import fs from "node:fs";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const root = path.resolve(__dirname, "..");
let db: PGlite;
let termsId: string;
let privacyId: string;

const ids = {
  brokerA: "00000000-0000-0000-0000-0000000000a1",
  brokerB: "00000000-0000-0000-0000-0000000000b2",
  investor: "00000000-0000-0000-0000-0000000000c3",
  borrower: "00000000-0000-0000-0000-0000000000d4",
  admin: "00000000-0000-0000-0000-0000000000e5",
  sneaky: "00000000-0000-0000-0000-0000000000f6",
};

async function asSystem() {
  await db.exec("reset role; select set_config('request.jwt.claims', '', false);");
}

async function asUser(uid: string | null, aal: "aal1" | "aal2" = "aal1") {
  await asSystem();
  if (uid === null) {
    await db.exec("set role anon;");
    return;
  }
  const claims = JSON.stringify({ sub: uid, role: "authenticated", aal });
  await db.query("select set_config('request.jwt.claims', $1, false)", [claims]);
  await db.exec("set role authenticated;");
}

async function signUp(id: string, email: string, meta: Record<string, unknown>) {
  await asSystem();
  await db.query("insert into auth.users (id, email, raw_user_meta_data) values ($1, $2, $3)", [id, email, JSON.stringify(meta)]);
}

const consents = () => ({ terms_version_id: termsId, privacy_version_id: privacyId, consent_ip: "203.0.113.7", consent_user_agent: "vitest" });

beforeAll(async () => {
  db = new PGlite();
  await db.exec(fs.readFileSync(path.join(root, "tests/auth-stub.sql"), "utf8"));
  for (const file of fs.readdirSync(path.join(root, "migrations")).sort()) {
    await db.exec(fs.readFileSync(path.join(root, "migrations", file), "utf8"));
  }
  const res = await db.query<{ id: string; kind: string }>("select id, kind from public.agreement_versions where is_active");
  termsId = res.rows.find((r) => r.kind === "terms")!.id;
  privacyId = res.rows.find((r) => r.kind === "privacy")!.id;

  await signUp(ids.brokerA, "a@broker.test", { requested_role: "BROKER", full_name: "Ana Broker", first_name: "Ana", last_name: "Broker", province: "San José", experience_years: "5", ...consents() });
  await signUp(ids.brokerB, "b@broker.test", { requested_role: "BROKER", full_name: "Beto Broker", first_name: "Beto", last_name: "Broker", ...consents() });
  await signUp(ids.investor, "i@investor.test", { requested_role: "INVESTOR", full_name: "Inés Inversora", available_capital: "250000", min_rate_pct: "12", max_ltv_pct: "50", max_term_months: "24", preferred_provinces: ["Guanacaste", "San José"], ...consents() });
  await signUp(ids.borrower, "s@borrower.test", { requested_role: "BORROWER", full_name: "Sergio Solicitante", legal_name: "Inversiones Demo S.A.", person_type: "company", ...consents() });
  await signUp(ids.admin, "admin@trust.test", { full_name: "Admin Demo" });
  await asSystem();
  await db.query("insert into public.user_roles (user_id, role) values ($1, 'ADMIN')", [ids.admin]);
  await db.query("update public.profiles set primary_role = 'ADMIN' where id = $1", [ids.admin]);
});

afterAll(async () => {
  await db?.close();
});

describe("Alta de usuarios (trigger handle_new_user)", () => {
  it("crea perfil, rol, perfil de broker pendiente y consentimientos", async () => {
    await asSystem();
    const p = await db.query<{ primary_role: string; terms_accepted_at: string | null }>("select primary_role, terms_accepted_at from public.profiles where id = $1", [ids.brokerA]);
    expect(p.rows[0].primary_role).toBe("BROKER");
    expect(p.rows[0].terms_accepted_at).not.toBeNull();
    const b = await db.query<{ status: string; experience_years: number }>("select status, experience_years from public.brokers where user_id = $1", [ids.brokerA]);
    expect(b.rows[0]).toMatchObject({ status: "pending", experience_years: 5 });
    const c = await db.query<{ n: number }>("select count(*)::int n from public.consent_records where user_id = $1 and ip = '203.0.113.7'", [ids.brokerA]);
    expect(c.rows[0].n).toBe(2);
  });

  it("crea preferencias del inversionista con arreglos", async () => {
    await asSystem();
    const r = await db.query<{ available_capital: string; preferred_provinces: string[] }>("select available_capital, preferred_provinces from public.investor_preferences where user_id = $1", [ids.investor]);
    expect(r.rows[0].available_capital).toBe("250000.00");
    expect(r.rows[0].preferred_provinces).toEqual(["Guanacaste", "San José"]);
  });

  it("crea el registro de solicitante como persona jurídica", async () => {
    await asSystem();
    const r = await db.query<{ legal_name: string; person_type: string }>("select legal_name, person_type from public.borrowers where user_id = $1", [ids.borrower]);
    expect(r.rows[0]).toEqual({ legal_name: "Inversiones Demo S.A.", person_type: "company" });
  });

  it("rechaza el registro sin aceptar términos y privacidad vigentes", async () => {
    await expect(
      signUp("00000000-0000-0000-0000-000000000099", "x@test.test", { requested_role: "BROKER", full_name: "Sin Consentimiento" }),
    ).rejects.toThrow(/términos/);
  });

  it("nunca asigna ADMIN desde los metadatos del registro", async () => {
    await signUp(ids.sneaky, "sneaky@test.test", { requested_role: "ADMIN", full_name: "Intento Admin", ...consents() });
    await asSystem();
    const r = await db.query<{ n: number }>("select count(*)::int n from public.user_roles where user_id = $1", [ids.sneaky]);
    expect(r.rows[0].n).toBe(0);
    const p = await db.query<{ primary_role: string | null }>("select primary_role from public.profiles where id = $1", [ids.sneaky]);
    expect(p.rows[0].primary_role).toBeNull();
  });
});

describe("Aislamiento entre usuarios (RLS)", () => {
  it("un broker solo ve su propio perfil y registro de broker", async () => {
    await asUser(ids.brokerA);
    const profiles = await db.query<{ id: string }>("select id from public.profiles");
    expect(profiles.rows.map((r) => r.id)).toEqual([ids.brokerA]);
    const brokers = await db.query<{ user_id: string }>("select user_id from public.brokers");
    expect(brokers.rows.map((r) => r.user_id)).toEqual([ids.brokerA]);
  });

  it("un broker no puede leer datos de inversionistas ni solicitantes", async () => {
    await asUser(ids.brokerA);
    expect((await db.query("select * from public.investor_preferences")).rows).toHaveLength(0);
    expect((await db.query("select * from public.borrowers")).rows).toHaveLength(0);
    expect((await db.query("select * from public.consent_records where user_id <> $1", [ids.brokerA])).rows).toHaveLength(0);
  });

  it("un usuario no puede modificar el perfil de otro", async () => {
    await asUser(ids.brokerA);
    const r = await db.query("update public.profiles set full_name = 'Hackeado' where id = $1 returning id", [ids.brokerB]);
    expect(r.rows).toHaveLength(0);
  });

  it("un broker no puede aprobarse a sí mismo", async () => {
    await asUser(ids.brokerA);
    await expect(db.query("update public.brokers set status = 'approved' where user_id = $1", [ids.brokerA])).rejects.toThrow(/permission denied/);
  });

  it("un usuario no puede cambiar su rol ni asignarse roles", async () => {
    await asUser(ids.brokerA);
    await expect(db.query("update public.profiles set primary_role = 'ADMIN' where id = $1", [ids.brokerA])).rejects.toThrow(/permission denied/);
    await expect(db.query("insert into public.user_roles (user_id, role) values ($1, 'ADMIN')", [ids.brokerA])).rejects.toThrow(/row-level security/);
  });

  it("un usuario sí puede editar sus datos de contacto", async () => {
    await asUser(ids.brokerA);
    const r = await db.query("update public.profiles set phone = '+506 8888 0000' where id = $1 returning id", [ids.brokerA]);
    expect(r.rows).toHaveLength(1);
  });

  it("anon no lee perfiles pero sí los textos legales vigentes", async () => {
    await asUser(null);
    await expect(db.query("select * from public.profiles")).rejects.toThrow(/permission denied/);
    const a = await db.query("select kind from public.agreement_versions");
    expect(a.rows).toHaveLength(3);
  });

  it("las notificaciones son privadas", async () => {
    await asUser(ids.investor);
    const r = await db.query<{ user_id: string }>("select user_id from public.notifications");
    expect(r.rows.length).toBeGreaterThan(0);
    expect(r.rows.every((n) => n.user_id === ids.investor)).toBe(true);
  });
});

describe("Administrador con MFA", () => {
  it("sin MFA (aal1) el administrador no obtiene acceso ampliado", async () => {
    await asUser(ids.admin, "aal1");
    const r = await db.query("select id from public.profiles");
    expect(r.rows).toHaveLength(1);
    expect((await db.query("select * from public.audit_logs")).rows).toHaveLength(0);
  });

  it("con MFA (aal2) ve todos los perfiles y la auditoría", async () => {
    await asUser(ids.admin, "aal2");
    const r = await db.query("select id from public.profiles");
    expect(r.rows.length).toBeGreaterThanOrEqual(6);
    expect((await db.query("select * from public.audit_logs")).rows.length).toBeGreaterThan(0);
  });

  it("los demás roles no leen la auditoría", async () => {
    await asUser(ids.brokerA, "aal2");
    expect((await db.query("select * from public.audit_logs")).rows).toHaveLength(0);
  });
});

describe("Trazabilidad e inmutabilidad", () => {
  it("las aceptaciones no se pueden modificar ni borrar", async () => {
    await asSystem();
    await expect(db.query("update public.consent_records set ip = 'x'")).rejects.toThrow(/inmutable/);
    await expect(db.query("delete from public.consent_records")).rejects.toThrow(/inmutable/);
  });

  it("el texto de un acuerdo publicado no se puede editar", async () => {
    await asSystem();
    await expect(db.query("update public.agreement_versions set body = 'otro' where id = $1", [termsId])).rejects.toThrow(/inmutable/);
  });

  it("los cambios de roles quedan auditados", async () => {
    await asSystem();
    const r = await db.query<{ n: number }>("select count(*)::int n from public.audit_logs where table_name = 'user_roles' and record_id is not null");
    expect(r.rows[0].n).toBeGreaterThanOrEqual(5);
  });

  it("la configuración vigente expone los parámetros comerciales", async () => {
    await asUser(ids.investor);
    const r = await db.query<{ value: unknown }>("select value from public.current_settings where key = 'target_max_ltv_pct'");
    expect(r.rows[0].value).toBe(50);
  });
});
