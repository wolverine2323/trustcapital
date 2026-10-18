import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import { requireRole } from "@/server/session";

export const metadata: Metadata = { title: "Configuración" };

const KIND_LABEL = { terms: "Términos y condiciones", privacy: "Política de privacidad", broker_intermediation: "Acuerdo de intermediación" } as const;
const KIND_LINK: Partial<Record<keyof typeof KIND_LABEL, string>> = { terms: "/terminos", privacy: "/privacidad" };

function renderValue(value: unknown): string {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const v = value as Record<string, unknown>;
    if ("min" in v && "max" in v) return `${Number(v.min).toLocaleString("de-DE")} – ${Number(v.max).toLocaleString("de-DE")}`;
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) return value.join(" · ");
  return typeof value === "number" ? value.toLocaleString("de-DE") : String(value);
}

export default async function AdminSettingsPage() {
  await requireRole("ADMIN");
  const supabase = await createClient();
  const [settingsRes, agreementsRes] = await Promise.all([
    supabase.from("current_settings").select("key, value, description, effective_from").order("key"),
    supabase.from("agreement_versions").select("id, kind, version, title, is_active, is_legal_draft, published_at, body_hash").order("created_at", { ascending: false }),
  ]);

  return (
    <>
      <PageHeader title="Configuración" description="Parámetros comerciales y textos legales vigentes." />
      <Alert tone="info" className="mb-6">
        Los parámetros se versionan por fecha de vigencia y no modifican retroactivamente acuerdos ni operaciones formalizadas. La edición
        desde esta pantalla se habilita junto con el módulo financiero.
      </Alert>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Parámetros comerciales</CardTitle>
            <CardDescription>Condiciones de referencia, configurables por operación.</CardDescription>
          </CardHeader>
          <CardContent className="p-0 sm:p-0">
            <dl className="divide-y divide-border">
              {(settingsRes.data ?? []).map((s) => (
                <div key={s.key} className="flex items-start justify-between gap-4 px-5 py-3 text-sm">
                  <dt>
                    <span className="block">{s.description ?? s.key}</span>
                    <span className="block font-mono text-[11px] text-muted-foreground">{s.key}</span>
                  </dt>
                  <dd className="tabular text-right font-medium">{renderValue(s.value)}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Textos legales</CardTitle>
            <CardDescription>Cada aceptación queda ligada a la versión y a su huella SHA-256.</CardDescription>
          </CardHeader>
          <CardContent className="p-0 sm:p-0">
            <ul className="divide-y divide-border">
              {(agreementsRes.data ?? []).map((a) => {
                const kind = a.kind as keyof typeof KIND_LABEL;
                const link = KIND_LINK[kind];
                return (
                  <li key={a.id} className="flex flex-col gap-1.5 px-5 py-3 text-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{KIND_LABEL[kind]}</span>
                      <Badge>v{a.version}</Badge>
                      {a.is_active && <Badge tone="success">Vigente</Badge>}
                      {a.is_legal_draft && <Badge tone="warning">Pendiente de revisión legal</Badge>}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 text-xs text-muted-foreground">
                      <span>Publicado {formatDate(a.published_at)}</span>
                      <span className="font-mono">{a.body_hash.slice(0, 16)}…</span>
                      {link && (
                        <Link href={link} target="_blank" className="inline-flex items-center gap-1 text-accent-strong hover:underline">
                          Ver <ExternalLink className="size-3" />
                        </Link>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
