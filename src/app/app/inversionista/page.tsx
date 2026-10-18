import type { Metadata } from "next";
import Link from "next/link";
import { CalendarClock, Coins, Heart, Landmark, LineChart, PiggyBank, Search, SlidersHorizontal, Wallet } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { KpiCard, KpiGrid } from "@/components/shared/kpi";
import { PageHeader } from "@/components/shared/page-header";
import { GUARANTEE_TYPES } from "@/lib/domain/catalogs";
import { formatMoney, formatPercent } from "@/lib/finance";
import { getInvestorPreferences } from "@/server/investor";
import { requireRole } from "@/server/session";

export const metadata: Metadata = { title: "Inicio" };

export default async function InvestorDashboardPage() {
  const session = await requireRole("INVESTOR");
  const prefs = await getInvestorPreferences(session.userId);
  const zero = formatMoney(0, "USD", 0);
  const guaranteeLabel = (v: string) => GUARANTEE_TYPES.find((g) => g.value === v)?.label ?? v;

  return (
    <>
      <PageHeader
        title={`Hola, ${session.profile?.full_name.split(" ")[0] ?? ""}`}
        description="Tu actividad como inversionista en Trust Capital."
        actions={
          <Button asChild variant="outline">
            <Link href="/app/inversionista/preferencias">
              <SlidersHorizontal /> Editar preferencias
            </Link>
          </Button>
        }
      />
      <Alert tone="info" title="Acceso al marketplace sujeto a autorización" className="mb-6">
        Trust Capital habilitará tu acceso a oportunidades tras revisar tu perfil. Las cifras de compromisos, desembolsos y pagos se
        muestran por separado y solo reflejan operaciones registradas.
      </Alert>
      <KpiGrid>
        <KpiCard label="Capital disponible declarado" value={formatMoney(prefs?.available_capital ?? null, "USD", 0)} icon={Wallet} tone="accent" hint={prefs?.available_capital ? "Declarado por ti" : "Sin declarar"} />
        <KpiCard label="Oportunidades compatibles" value="0" icon={LineChart} />
        <KpiCard label="Guardadas" value="0" icon={Heart} />
        <KpiCard label="Manifestaciones de interés" value="0" icon={Search} />
        <KpiCard label="Capital comprometido" value={zero} icon={Coins} hint="Compromisos confirmados" />
        <KpiCard label="Capital desembolsado" value={zero} icon={Landmark} hint="Desembolsos registrados" />
        <KpiCard label="Intereses estimados" value={zero} icon={PiggyBank} hint="Estimación, no garantía" />
        <KpiCard label="Pagos recibidos" value={zero} icon={CalendarClock} hint="Registrados por Trust Capital" />
      </KpiGrid>
      <div className="mt-6 grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Oportunidades compatibles</CardTitle>
            <CardDescription>Según tus preferencias de tasa, plazo, LTV y ubicación.</CardDescription>
          </CardHeader>
          <CardContent>
            <EmptyState icon={LineChart} title="Aún no hay oportunidades publicadas" description="Cuando Trust Capital publique oportunidades autorizadas, verás aquí las más compatibles con tu perfil." />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Tu perfil de inversión</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="tabular space-y-2.5 text-sm">
              {[
                ["Rango por operación", prefs?.min_investment || prefs?.max_investment ? `${formatMoney(prefs?.min_investment ?? null, "USD", 0)} – ${formatMoney(prefs?.max_investment ?? null, "USD", 0)}` : "Sin definir"],
                ["Tasa mínima", prefs?.min_rate_pct ? formatPercent(prefs.min_rate_pct, 1) : "Sin definir"],
                ["Plazo máximo", prefs?.max_term_months ? `${prefs.max_term_months} meses` : "Sin definir"],
                ["LTV máximo", prefs?.max_ltv_pct ? formatPercent(prefs.max_ltv_pct, 0) : "Sin definir"],
                ["Provincias", prefs?.preferred_provinces.length ? prefs.preferred_provinces.join(", ") : "Todas"],
                ["Garantías", prefs?.guarantee_types.length ? prefs.guarantee_types.map(guaranteeLabel).join(", ") : "Todas"],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="text-right font-medium">{v}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
