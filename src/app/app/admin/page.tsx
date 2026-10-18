import type { Metadata } from "next";
import Link from "next/link";
import {
  Briefcase,
  Building2,
  CalendarClock,
  CheckCircle2,
  FileSearch,
  Landmark,
  PiggyBank,
  Store,
  TrendingUp,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { KpiCard, KpiGrid } from "@/components/shared/kpi";
import { PageHeader } from "@/components/shared/page-header";
import { RoleBadge } from "@/components/shared/role-badge";
import { formatMoney } from "@/lib/finance";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import { requireRole } from "@/server/session";

export const metadata: Metadata = { title: "Dashboard ejecutivo" };

export default async function AdminDashboardPage() {
  await requireRole("ADMIN");
  const supabase = await createClient();

  const [rolesRes, pendingBrokersRes, approvedBrokersRes, recentRes] = await Promise.all([
    supabase.from("user_roles").select("role"),
    supabase.from("brokers").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("brokers").select("id", { count: "exact", head: true }).eq("status", "approved"),
    supabase.from("profiles").select("id, full_name, email, primary_role, created_at").order("created_at", { ascending: false }).limit(8),
  ]);

  const roleCounts = (rolesRes.data ?? []).reduce<Record<string, number>>((acc, r) => {
    acc[r.role] = (acc[r.role] ?? 0) + 1;
    return acc;
  }, {});
  const zero = formatMoney(0, "USD", 0);

  return (
    <>
      <PageHeader
        title="Dashboard ejecutivo"
        description="Visión general de la originación, el marketplace y las comisiones."
        actions={
          <Button asChild variant="outline">
            <Link href="/app/admin/usuarios"><Users /> Ver usuarios</Link>
          </Button>
        }
      />

      <h2 className="mb-3 text-sm font-semibold text-muted-foreground">Participantes</h2>
      <KpiGrid>
        <KpiCard label="Brokers activos" value={approvedBrokersRes.count ?? 0} icon={Building2} tone="accent" hint={`${roleCounts.BROKER ?? 0} registrados`} />
        <KpiCard label="Brokers por aprobar" value={pendingBrokersRes.count ?? 0} icon={UserPlus} tone={pendingBrokersRes.count ? "warning" : "default"} />
        <KpiCard label="Inversionistas" value={roleCounts.INVESTOR ?? 0} icon={PiggyBank} />
        <KpiCard label="Solicitantes" value={roleCounts.BORROWER ?? 0} icon={Users} />
      </KpiGrid>

      <h2 className="mb-3 mt-8 text-sm font-semibold text-muted-foreground">Originación y financiamiento</h2>
      <KpiGrid>
        <KpiCard label="Solicitudes totales" value="0" icon={Briefcase} hint="0 este mes" />
        <KpiCard label="En revisión" value="0" icon={FileSearch} />
        <KpiCard label="Aprobados" value="0" icon={CheckCircle2} />
        <KpiCard label="Publicados" value="0" icon={Store} />
        <KpiCard label="Volumen solicitado" value={zero} icon={TrendingUp} />
        <KpiCard label="Volumen aprobado" value={zero} icon={TrendingUp} />
        <KpiCard label="Volumen desembolsado" value={zero} icon={Landmark} tone="accent" />
        <KpiCard label="Pendiente de financiar" value={zero} icon={CalendarClock} />
      </KpiGrid>

      <h2 className="mb-3 mt-8 text-sm font-semibold text-muted-foreground">Comisiones</h2>
      <KpiGrid>
        <KpiCard label="Comisiones recibidas" value={zero} icon={Wallet} />
        <KpiCard label="Participación Trust Capital" value={zero} icon={Wallet} tone="accent" />
        <KpiCard label="Devengadas a brokers" value={zero} icon={Wallet} />
        <KpiCard label="Pendientes de pago" value={zero} icon={CalendarClock} tone="warning" />
      </KpiGrid>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Registros recientes</CardTitle>
          <CardDescription>Últimas cuentas creadas en la plataforma.</CardDescription>
        </CardHeader>
        <CardContent className="p-0 sm:p-0">
          {recentRes.data?.length ? (
            <ul className="divide-y divide-border">
              {recentRes.data.map((p) => (
                <li key={p.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{p.full_name}</p>
                    <p className="truncate text-xs text-muted-foreground">{p.email}</p>
                  </div>
                  <RoleBadge role={p.primary_role} />
                  <span className="hidden w-28 text-right text-xs text-muted-foreground sm:block">{formatDate(p.created_at)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState icon={Users} title="Sin registros todavía" />
          )}
        </CardContent>
      </Card>
    </>
  );
}
