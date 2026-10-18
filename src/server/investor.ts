import "server-only";
import { createClient } from "@/lib/supabase/server";

export interface InvestorPreferences {
  user_id: string;
  nationality: string | null;
  residence_country: string | null;
  available_capital: string | null;
  min_investment: string | null;
  max_investment: string | null;
  currency: string;
  min_rate_pct: string | null;
  max_term_months: number | null;
  max_ltv_pct: string | null;
  preferred_provinces: string[];
  property_types: string[];
  guarantee_types: string[];
  experience: string | null;
  payment_preference: string | null;
  prepayment_conditions: string | null;
  risk_tolerance: "low" | "medium" | "high" | null;
}

export async function getInvestorPreferences(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("investor_preferences").select("*").eq("user_id", userId).maybeSingle<InvestorPreferences>();
  return data;
}
