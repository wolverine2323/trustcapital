import "server-only";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseEnv, isSupabaseConfigured } from "@/lib/supabase/env";

export type AgreementKind = "terms" | "privacy" | "broker_intermediation";

export interface AgreementVersion {
  id: string;
  kind: AgreementKind;
  version: string;
  title: string;
  body: string;
  body_hash: string;
  is_legal_draft: boolean;
  published_at: string | null;
}

export async function getActiveAgreements(kinds: AgreementKind[]): Promise<Partial<Record<AgreementKind, AgreementVersion>>> {
  if (!isSupabaseConfigured()) return {};
  // Lectura pública (rol anon): no depende de cookies, permite cachear las páginas legales.
  const { url, key } = getSupabaseEnv();
  const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await supabase
    .from("agreement_versions")
    .select("id, kind, version, title, body, body_hash, is_legal_draft, published_at")
    .eq("is_active", true)
    .in("kind", kinds);
  if (error || !data) return {};
  return Object.fromEntries((data as AgreementVersion[]).map((a) => [a.kind, a]));
}
