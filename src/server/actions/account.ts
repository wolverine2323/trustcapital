"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { investorPreferencesSchema, profileUpdateSchema } from "@/lib/validation/auth";
import { invalid, type ActionResult } from "./types";

async function authed() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function updateProfileAction(input: unknown): Promise<ActionResult> {
  const parsed = profileUpdateSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const { supabase, user } = await authed();
  if (!user) return { ok: false, message: "Tu sesión expiró. Vuelve a ingresar." };

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: parsed.data.fullName,
      phone: parsed.data.phone,
      country: parsed.data.country,
      person_type: parsed.data.personType,
    })
    .eq("id", user.id);
  if (error) return { ok: false, message: "No pudimos guardar los cambios." };
  revalidatePath("/app", "layout");
  return { ok: true, message: "Perfil actualizado." };
}

export async function updateInvestorPreferencesAction(input: unknown): Promise<ActionResult> {
  const parsed = investorPreferencesSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const { supabase, user } = await authed();
  if (!user) return { ok: false, message: "Tu sesión expiró. Vuelve a ingresar." };
  const v = parsed.data;

  const { data, error } = await supabase
    .from("investor_preferences")
    .update({
      available_capital: v.availableCapital ?? null,
      min_investment: v.minInvestment ?? null,
      max_investment: v.maxInvestment ?? null,
      min_rate_pct: v.minRatePct ?? null,
      max_term_months: v.maxTermMonths ? Number(v.maxTermMonths) : null,
      max_ltv_pct: v.maxLtvPct ?? null,
      preferred_provinces: v.preferredProvinces,
      guarantee_types: v.guaranteeTypes,
      payment_preference: v.paymentPreference ?? null,
      prepayment_conditions: v.prepaymentConditions ?? null,
      risk_tolerance: v.riskTolerance ?? null,
    })
    .eq("user_id", user.id)
    .select("user_id");
  if (error || !data?.length) return { ok: false, message: "No pudimos guardar tus preferencias." };
  revalidatePath("/app/inversionista", "layout");
  return { ok: true, message: "Preferencias guardadas." };
}

const idSchema = z.string().uuid();

export async function markNotificationReadAction(id: string): Promise<ActionResult> {
  if (!idSchema.safeParse(id).success) return { ok: false, message: "Notificación inválida." };
  const { supabase } = await authed();
  const { error } = await supabase.rpc("mark_notification_read", { notification_id: id });
  if (error) return { ok: false, message: "No pudimos actualizar la notificación." };
  revalidatePath("/app", "layout");
  return { ok: true };
}

export async function markAllNotificationsReadAction(): Promise<ActionResult> {
  const { supabase } = await authed();
  const { error } = await supabase.rpc("mark_all_notifications_read");
  if (error) return { ok: false, message: "No pudimos actualizar las notificaciones." };
  revalidatePath("/app", "layout");
  return { ok: true };
}
