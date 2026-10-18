"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/supabase/env";
import {
  emailSchema,
  newPasswordSchema,
  safeNextPath,
  SIGN_UP_SCHEMAS,
  signInSchema,
  totpCodeSchema,
} from "@/lib/validation/auth";
import { invalid, type ActionResult } from "./types";

async function clientFingerprint() {
  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0]?.trim() || h.get("x-real-ip") || null;
  return { ip, userAgent: h.get("user-agent")?.slice(0, 512) ?? null };
}

/* -------------------------------------------------------------------------- */
/* Registro                                                                    */
/* -------------------------------------------------------------------------- */

export async function signUpAction(input: unknown): Promise<ActionResult> {
  const role = (input as { role?: string } | null)?.role;
  if (role !== "BORROWER" && role !== "BROKER" && role !== "INVESTOR") {
    return { ok: false, message: "Selecciona cómo deseas utilizar Trust Capital." };
  }
  const parsed = SIGN_UP_SCHEMAS[role].safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const v = parsed.data;
  const { ip, userAgent } = await clientFingerprint();

  const metadata: Record<string, unknown> = {
    requested_role: v.role,
    full_name: v.fullName,
    phone: v.phone,
    country: v.country,
    person_type: v.personType,
    terms_version_id: v.termsVersionId,
    privacy_version_id: v.privacyVersionId,
    consent_ip: ip,
    consent_user_agent: userAgent,
  };

  if (v.role === "BORROWER") {
    Object.assign(metadata, {
      legal_name: v.legalName,
      identification: v.identification,
      economic_activity: v.economicActivity,
      province: v.province,
    });
  } else if (v.role === "BROKER") {
    Object.assign(metadata, {
      first_name: v.firstName,
      last_name: v.lastName,
      company_name: v.companyName,
      tax_id: v.taxId,
      province: v.province,
      whatsapp: v.whatsapp,
      experience_years: v.experienceYears,
      experience_summary: v.experienceSummary,
    });
  } else {
    Object.assign(metadata, {
      nationality: v.nationality,
      residence_country: v.residenceCountry,
      available_capital: v.availableCapital,
      min_investment: v.minInvestment,
      max_investment: v.maxInvestment,
      min_rate_pct: v.minRatePct,
      max_term_months: v.maxTermMonths,
      max_ltv_pct: v.maxLtvPct,
      preferred_provinces: v.preferredProvinces,
      guarantee_types: v.guaranteeTypes,
      experience: v.experience,
      payment_preference: v.paymentPreference,
    });
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: v.email,
    password: v.password,
    options: { data: metadata, emailRedirectTo: `${getSiteUrl()}/auth/callback?next=/app` },
  });

  if (error) {
    if (error.code === "user_already_exists") {
      return { ok: false, message: "Ya existe una cuenta con este correo. Inicia sesión o recupera tu contraseña." };
    }
    if (error.code === "weak_password") {
      return { ok: false, message: "La contraseña es demasiado débil o apareció en filtraciones conocidas. Elige otra.", fieldErrors: { password: "Elige una contraseña más segura." } };
    }
    if (error.code === "over_email_send_rate_limit" || error.status === 429) {
      return { ok: false, message: "Demasiados intentos. Espera unos minutos e inténtalo de nuevo." };
    }
    if (/términos/i.test(error.message)) {
      return { ok: false, message: "Los términos o la política de privacidad cambiaron. Recarga la página y acéptalos de nuevo." };
    }
    console.error("signUp error", error.code, error.status);
    return { ok: false, message: "No pudimos crear tu cuenta. Inténtalo de nuevo en unos minutos." };
  }

  return { ok: true, message: "Te enviamos un correo para confirmar tu cuenta. Abre el enlace para activarla." };
}

export async function resendConfirmationAction(input: unknown): Promise<ActionResult> {
  const parsed = emailSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const supabase = await createClient();
  await supabase.auth.resend({
    type: "signup",
    email: parsed.data.email,
    options: { emailRedirectTo: `${getSiteUrl()}/auth/callback?next=/app` },
  });
  return { ok: true, message: "Si la cuenta existe y no está confirmada, te reenviamos el correo de confirmación." };
}

/* -------------------------------------------------------------------------- */
/* Inicio de sesión                                                            */
/* -------------------------------------------------------------------------- */

export async function signInAction(input: unknown): Promise<ActionResult> {
  const parsed = signInSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const { email, password } = parsed.data;
  const next = safeNextPath(parsed.data.next);

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    if (error.code === "email_not_confirmed") {
      return { ok: false, code: "email_not_confirmed", message: "Confirma tu correo antes de ingresar. Revisa tu bandeja de entrada." };
    }
    if (error.status === 429) return { ok: false, message: "Demasiados intentos. Espera unos minutos." };
    return { ok: false, message: "Correo o contraseña incorrectos." };
  }

  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal && aal.nextLevel === "aal2" && aal.currentLevel !== "aal2") {
    redirect(`/login/mfa?next=${encodeURIComponent(next)}`);
  }
  redirect(next);
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

/* -------------------------------------------------------------------------- */
/* Recuperación de contraseña                                                  */
/* -------------------------------------------------------------------------- */

export async function requestPasswordResetAction(input: unknown): Promise<ActionResult> {
  const parsed = emailSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${getSiteUrl()}/auth/callback?next=/actualizar-contrasena`,
  });
  if (error?.status === 429) return { ok: false, message: "Demasiadas solicitudes. Espera unos minutos." };
  // Respuesta neutra: no revela si el correo existe.
  return { ok: true, message: "Si el correo está registrado, recibirás un enlace para restablecer tu contraseña." };
}

export async function updatePasswordAction(input: unknown): Promise<ActionResult> {
  const parsed = newPasswordSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "El enlace expiró. Solicita uno nuevo." };
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    if (error.code === "same_password") return { ok: false, message: "La nueva contraseña debe ser diferente a la anterior." };
    if (error.code === "weak_password") return { ok: false, message: "Elige una contraseña más segura.", fieldErrors: { password: "Contraseña débil." } };
    if (error.code === "insufficient_aal") return { ok: false, message: "Verifica tu código de autenticación antes de cambiar la contraseña." };
    return { ok: false, message: "No pudimos actualizar la contraseña." };
  }
  return { ok: true, message: "Contraseña actualizada." };
}

/* -------------------------------------------------------------------------- */
/* MFA (TOTP) — obligatorio para administradores                               */
/* -------------------------------------------------------------------------- */

export async function startTotpEnrollmentAction(): Promise<ActionResult<{ factorId: string; qrCode: string; secret: string }>> {
  const supabase = await createClient();
  const { data: factors } = await supabase.auth.mfa.listFactors();
  // Elimina inscripciones abandonadas (no verificadas) antes de crear una nueva.
  for (const f of factors?.all ?? []) {
    if (f.factor_type === "totp" && f.status === "unverified") await supabase.auth.mfa.unenroll({ factorId: f.id });
  }
  if ((factors?.totp ?? []).some((f) => f.status === "verified")) {
    return { ok: false, message: "Ya tienes un autenticador activo." };
  }
  const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: `Trust Capital ${Date.now()}` });
  if (error || !data) return { ok: false, message: "No pudimos iniciar la configuración. Inténtalo de nuevo." };
  return { ok: true, data: { factorId: data.id, qrCode: data.totp.qr_code, secret: data.totp.secret } };
}

export async function verifyTotpEnrollmentAction(input: { factorId: string; code: string }): Promise<ActionResult> {
  const parsed = totpCodeSchema.safeParse({ code: input.code });
  if (!parsed.success) return invalid(parsed.error);
  const supabase = await createClient();
  const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: input.factorId, code: parsed.data.code });
  if (error) return { ok: false, message: "Código incorrecto o vencido.", fieldErrors: { code: "Código incorrecto." } };
  return { ok: true, message: "Autenticación en dos pasos activada." };
}

export async function verifyMfaLoginAction(input: { code: string; next?: string }): Promise<ActionResult> {
  const parsed = totpCodeSchema.safeParse({ code: input.code });
  if (!parsed.success) return invalid(parsed.error);
  const supabase = await createClient();
  const { data: factors } = await supabase.auth.mfa.listFactors();
  const factor = factors?.totp.find((f) => f.status === "verified");
  if (!factor) return { ok: false, message: "No tienes un autenticador configurado." };
  const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: factor.id, code: parsed.data.code });
  if (error) return { ok: false, message: "Código incorrecto o vencido.", fieldErrors: { code: "Código incorrecto." } };
  redirect(safeNextPath(input.next));
}
