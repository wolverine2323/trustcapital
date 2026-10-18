import type { Metadata } from "next";
import Link from "next/link";
import { ScrollText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { requireRole } from "@/server/session";

export const metadata: Metadata = { title: "Auditoría" };

const TABLES: Record<string, string> = {
  profiles: "Perfiles",
  user_roles: "Roles",
  brokers: "Brokers",
  consent_records: "Aceptaciones",
  agreement_versions: "Acuerdos",
  system_settings: "Configuración",
};
const ACTION_TONE = { INSERT: "success", UPDATE: "info", DELETE: "danger" } as const;
const ACTION_LABEL = { INSERT: "Alta", UPDATE: "Cambio", DELETE: "Baja" } as const;

function changedFields(oldData: Record<string, unknown> | null, newData: Record<string, unknown> | null): string[] {
  if (!oldData || !newData) return [];
  return Object.keys(newData).filter((k) => k !== "updated_at" && JSON.stringify(oldData[k]) !== JSON.stringify(newData[k]));
}

const dateTime = new Intl.DateTimeFormat("es-CR", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Costa_Rica" });

export default async function AdminAuditPage({ searchParams }: { searchParams: Promise<{ tabla?: string }> }) {
  await requireRole("ADMIN");
  const { tabla } = await searchParams;
  const table = tabla && tabla in TABLES ? tabla : null;
  const supabase = await createClient();

  let query = supabase.from("audit_logs").select("id, table_name, record_id, action, old_data, new_data, actor_id, created_at").order("created_at", { ascending: false }).limit(100);
  if (table) query = query.eq("table_name", table);
  const { data: logs } = await query;

  const actorIds = [...new Set((logs ?? []).map((l) => l.actor_id).filter(Boolean))] as string[];
  const { data: actors } = actorIds.length ? await supabase.from("profiles").select("id, full_name").in("id", actorIds) : { data: [] };
  const actorName = new Map((actors ?? []).map((a) => [a.id, a.full_name as string]));

  return (
    <>
      <PageHeader title="Auditoría" description="Últimos 100 eventos registrados. Los registros de auditoría no se pueden modificar." />
      <div className="mb-4 flex flex-wrap gap-2">
        {[null, ...Object.keys(TABLES)].map((t) => (
          <Link
            key={t ?? "all"}
            href={t ? `/app/admin/auditoria?tabla=${t}` : "/app/admin/auditoria"}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
              table === t ? "border-primary bg-primary text-white" : "border-border bg-card text-muted-foreground hover:text-foreground",
            )}
          >
            {t ? TABLES[t] : "Todo"}
          </Link>
        ))}
      </div>
      <Card className="overflow-hidden">
        {!logs?.length ? (
          <EmptyState icon={ScrollText} title="Sin eventos registrados" />
        ) : (
          <ul className="divide-y divide-border">
            {logs.map((log) => {
              const action = log.action as keyof typeof ACTION_TONE;
              const fields = changedFields(log.old_data, log.new_data);
              return (
                <li key={log.id} className="flex flex-col gap-1 px-5 py-3 text-sm sm:flex-row sm:items-center sm:gap-4">
                  <span className="tabular w-40 shrink-0 text-xs text-muted-foreground">{dateTime.format(new Date(log.created_at))}</span>
                  <span className="flex flex-1 flex-wrap items-center gap-2">
                    <Badge tone={ACTION_TONE[action] ?? "neutral"}>{ACTION_LABEL[action] ?? log.action}</Badge>
                    <span className="font-medium">{TABLES[log.table_name] ?? log.table_name}</span>
                    {fields.length > 0 && <span className="text-muted-foreground">· {fields.join(", ")}</span>}
                  </span>
                  <span className="truncate text-xs text-muted-foreground sm:w-48 sm:text-right">
                    {log.actor_id ? actorName.get(log.actor_id) ?? "Usuario" : "Sistema"}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </>
  );
}
