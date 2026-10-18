import type { Metadata } from "next";
import { Briefcase, CheckCircle2, Clock, FileSearch, Landmark, Store, TrendingUp, Wallet } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checklist } from "@/components/shared/checklist";
import { EmptyState } from "@/components/shared/empty-state";
import { KpiCard, KpiGrid } from "@/components/shared/kpi";
import { PageHeader } from "@/components/shared/page-header";
import { formatMoney } from "@/lib/finance";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/server/session";

export const metadata: Metadata = { title: "Dashboard del broker" };

const STATUS_COPY = {
  pending: { tone: "warning", title: "Tu perfil está en revisión", text: "Trust Capital revisará tu información. Podrás presentar casos formalmente una vez aprobado." },
  approved: { tone: "success", title: "Perfil aprobado", text: "Ya puedes presentar casos formalmente tras aceptar el acuerdo de intermediación." },
  suspended: { tone: "danger", title: "Cuenta suspendida", text: "Tu cuenta de broker está suspendida. Contacta a Trust Capital." },
  rejected: { tone: "danger", title: "Solicitud no aprobada", text: "Tu solicitud como broker no fue aprobada. Contacta a Trust Capital para más información." },
} as const;

export default async function BrokerDashboardPage() {
  const session = await requireRole("BROKER");
  const supabase = await createClient();
  const { data: broker } = await supabase
    .from("brokers")
    .select("first_name, status, status_reason")
    .eq("user_id", session.userId)
    .maybeSingle<{ first_name: string; status: keyof typeof STATUS_COPY; status_reason: string | null }>();

  const status = broker?.status ?? "pending";
  const copy = STATUS_COPY[status];
  // Los casos y comisiones se registran a partir de la Fase 2 (originación) y Fase 4 (comisiones).
  const zero = formatMoney(0, "USD", 0);

  return (
    <>
      <PageHeader title={`Hola, ${broker?.first_name ?? session.profile?.full_name ?? ""}`.trim()} description="Resumen de tus casos y comisiones." />

      <Alert tone={copy.tone} title={copy.title} className="mb-6">
        {copy.text}
        {broker?.status_reason && <span className="mt-1 block">Motivo: {broker.status_reason}</span>}
      </Alert>

      <KpiGrid>
        <KpiCard label="Casos presentados" value="0" icon={Briefcase} />
        <KpiCard label="En revisión" value="0" icon={FileSearch} />
        <KpiCard label="Aprobados" value="0" icon={CheckCircle2} />
        <KpiCard label="Publicados" value="0" icon={Store} />
        <KpiCard label="Financiados" value="0" icon={Landmark} tone="accent" />
        <KpiCard label="Volumen presentado" value={zero} icon={TrendingUp} />
        <KpiCard label="Volumen financiado" value={zero} icon={TrendingUp} />
        <KpiCard label="Comisiones estimadas" value={zero} icon={Wallet} hint="50 % de la comisión elegible recibida" />
      </KpiGrid>
      <KpiGrid className="mt-3 sm:mt-4 lg:grid-cols-2">
        <KpiCard label="Comisiones pagadas" value={zero} icon={Wallet} tone="accent" />
        <KpiCard label="Comisiones pendientes" value={zero} icon={Clock} tone="warning" />
      </KpiGrid>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Casos recientes</CardTitle>
            <CardDescription>Los casos que presentes aparecerán aquí con su estado actual.</CardDescription>
          </CardHeader>
          <CardContent>
            <EmptyState icon={Briefcase} title="Aún no has presentado casos" description="El registro guiado de casos estará disponible en la siguiente fase de la plataforma." />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Próximos pasos</CardTitle>
          </CardHeader>
          <CardContent>
            <Checklist
              items={[
                { label: "Crear tu cuenta", state: "done" },
                { label: "Confirmar tu correo", state: "done" },
                {
                  label: "Aprobación de Trust Capital",
                  state: status === "approved" ? "done" : "waiting",
                  description: status === "approved" ? undefined : "Revisión de tu perfil profesional.",
                },
                { label: "Completar datos de pago e identificación", state: "pending" },
                { label: "Aceptar el acuerdo de intermediación", state: "pending", description: "Distribución 50/50 sobre la comisión elegible recibida." },
                { label: "Presentar tu primer caso", state: "pending" },
              ]}
            />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
