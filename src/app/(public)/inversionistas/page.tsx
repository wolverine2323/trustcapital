import type { Metadata } from "next";
import { Building2, FileSearch, Filter, Gauge, Heart, ShieldAlert } from "lucide-react";
import { CtaBand, Disclaimer, FeatureGrid, PageHero, Section } from "@/components/public/sections";
import { formatMoney, simpleInterestSummary } from "@/lib/finance";

export const metadata: Metadata = { title: "Inversionistas" };

const example = simpleInterestSummary(250_000, 12, 12);

export default function InvestorsLandingPage() {
  return (
    <>
      <PageHero
        eyebrow="Para inversionistas"
        title="Oportunidades privadas respaldadas por garantías reales"
        description="Explora operaciones evaluadas por Trust Capital con información financiera, de garantía, documentos autorizados y riesgos explicados."
        primary={{ href: "/registro?tipo=inversionista", label: "Solicitar acceso" }}
      />
      <Section title="Información para decidir">
        <FeatureGrid
          items={[
            { icon: Gauge, title: "LTV sobre valor aceptado", text: "La relación préstamo-valor se calcula sobre el valor de garantía aceptado por Trust Capital." },
            { icon: Building2, title: "Garantía", text: "Tipo, ubicación general, áreas, construcciones, avalúo y situación registral autorizada." },
            { icon: FileSearch, title: "Documentos autorizados", text: "Acceso a la documentación aprobada para cada oportunidad." },
            { icon: Filter, title: "Filtros y compatibilidad", text: "Filtra por provincia, tasa, plazo, LTV y monto según tu perfil de inversión." },
            { icon: Heart, title: "Favoritos e interés", text: "Guarda oportunidades y manifiesta interés indicando un monto." },
            { icon: ShieldAlert, title: "Riesgos explícitos", text: "Crediticio, de liquidez, de valoración, legal y de ejecución." },
          ]}
        />
      </Section>
      <div className="bg-background">
        <Section title="Ejemplo de estimación" description="Interés simple, pagos mensuales y capital al vencimiento.">
          <dl className="tabular grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-4">
            {[
              ["Capital", formatMoney(250_000, "USD", 0)],
              ["Interés mensual (12 % anual)", formatMoney(example.monthlyInterest, "USD", 0)],
              ["Interés total (12 meses)", formatMoney(example.totalInterest, "USD", 0)],
              ["Capital + intereses", formatMoney(example.totalRepayment, "USD", 0)],
            ].map(([k, v]) => (
              <div key={k} className="bg-card p-5">
                <dt className="text-sm text-muted-foreground">{k}</dt>
                <dd className="mt-1 text-lg font-semibold text-primary">{v}</dd>
              </div>
            ))}
          </dl>
          <Disclaimer>
            Estimación ilustrativa antes de formalización; no constituye una oferta ni una garantía de rendimiento. Manifestar interés no
            constituye una inversión. El acceso al marketplace está sujeto a autorización de Trust Capital.
          </Disclaimer>
        </Section>
      </div>
      <div className="pt-14 sm:pt-20">
        <CtaBand title="Solicita tu acceso" text="Crea tu perfil de inversión. Te pediremos más información de forma progresiva." href="/registro?tipo=inversionista" label="Registrarme" />
      </div>
    </>
  );
}
