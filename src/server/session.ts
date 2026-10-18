import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { resolveActiveRole, ROLE_HOME, type AppRole } from "@/lib/domain/roles";

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  country: string;
  person_type: "individual" | "company";
  primary_role: AppRole | null;
  terms_accepted_at: string | null;
  privacy_accepted_at: string | null;
  created_at: string;
}

export interface SessionContext {
  userId: string;
  email: string;
  profile: Profile | null;
  roles: AppRole[];
  activeRole: AppRole | null;
  aal: "aal1" | "aal2";
  hasVerifiedMfa: boolean;
  unreadNotifications: number;
}

/** Contexto de sesión validado en el servidor. Memoizado por request. */
export const getSession = cache(async (): Promise<SessionContext | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: profile }, { data: roleRows }, aalRes, factorsRes, unreadRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle<Profile>(),
    supabase.from("user_roles").select("role").eq("user_id", user.id),
    supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
    supabase.auth.mfa.listFactors(),
    supabase.from("notifications").select("id", { count: "exact", head: true }).is("read_at", null),
  ]);

  const roles = (roleRows ?? []).map((r) => r.role as AppRole);
  return {
    userId: user.id,
    email: user.email ?? "",
    profile: profile ?? null,
    roles,
    activeRole: resolveActiveRole(profile?.primary_role, roles),
    aal: aalRes.data?.currentLevel === "aal2" ? "aal2" : "aal1",
    hasVerifiedMfa: (factorsRes.data?.totp ?? []).some((f) => f.status === "verified"),
    unreadNotifications: unreadRes.count ?? 0,
  };
});

export async function requireSession(): Promise<SessionContext> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

/**
 * Exige un rol. Para ADMIN exige además MFA verificado en la sesión (aal2).
 * Es una guarda de servidor: RLS sigue siendo la última línea de defensa.
 */
export async function requireRole(role: AppRole): Promise<SessionContext> {
  const session = await requireSession();
  if (!session.roles.includes(role)) {
    redirect(session.activeRole ? ROLE_HOME[session.activeRole] : "/app");
  }
  if (role === "ADMIN" && session.aal !== "aal2") {
    redirect(session.hasVerifiedMfa ? "/login/mfa?next=/app/admin" : "/app/seguridad?mfa=required");
  }
  return session;
}
