import Link from "next/link";
import { ArrowRight, Building2, FileCheck2, Handshake, Landmark, LineChart, ShieldCheck } from "lucide-react";
import { CtaBand, Disclaimer, PageHero, Section, Steps } from "@/components/public/sections";
import { DEFAULT_POLICY, formatMoney } from "@/lib/finance";

const audiences = [
  {
    href: "/registro?tipo=solicitante",
    icon: Landmark,
    title: "Quiero solicitar un crédito",
    text: "Presenta tu necesidad de financiamiento y la garantía que ofreces. Te acompañamos en todo el proceso.",
  },
  {
    href: "/registro?tipo=broker",
    icon: Handshake,
    title: "Soy broker o intermediario",
    text: "Presenta casos de tus clientes, da seguimiento en tiempo real y consulta tus comisiones con total claridad.",
  },
  {
    href: "/registro?tipo=inversionista",
    icon: LineChart,
    title: "Quiero invertir",
    text: "Analiza oportunidades privadas respaldadas por garantías reales, con información financiera y documental.",
  },
];

const terms = [
  { label: "Montos habituales", value: `${formatMoney(DEFAULT_POLICY.minAmount, "USD", 0)} – ${formatMoney(DEFAULT_POLICY.maxAmount, "USD", 0)}` },
  { label: "Plazos habituales", value: `${DEFAULT_POLICY.minTermMonths} a ${DEFAULT_POLICY.maxTermMonths} meses` },
  { label: "Tasa anual de referencia", value: "12 %" },
  { label: "LTV objetivo", value: "Máximo 50 %" },
  { label: "Evaluación preliminar", value: "Objetivo de 48 horas" },
  { label: "Desembolso", value: "Objetivo de 15 días hábiles" },
];

export default function HomePage() {
  return (
    <>
      <PageHero
        eyebrow="Trust Capital Marketplace · Costa Rica"
        title="Capital privado. Garantías reales. Oportunidades estructuradas."
        description="Conectamos necesidades de financiamiento con inversionistas privados mediante créditos respaldados por garantías inmobiliarias, con procesos claros, documentados y trazables."
        primary={{ href: "/registro", label: "Comenzar" }}
        secondary={{ href: "/como-funciona", label: "Cómo funciona" }}
      />

      <Section title="¿Cómo deseas utilizar Trust Capital?" description="Elige tu perfil para crear una cuenta adaptada a lo que necesitas.">
        <div className="grid gap-4 md:grid-cols-3">
          {audiences.map(({ href, icon: Icon, title, text }) => (
            <Link
              key={href}
              href={href}
              className="group flex flex-col rounded-xl border border-border bg-card p-6 transition-all hover:-translate-y-0.5 hover:border-accent/50 hover:shadow-[0_8px_30px_rgba(11,31,58,0.08)]"
            >
              <span className="inline-flex size-10 items-center justify-center rounded-lg bg-primary text-white">
                <Icon className="size-5" />
              </span>
              <h3 className="mt-5 text-lg font-semibold text-primary">{title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{text}</p>
              <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-accent-strong">
                Crear cuenta <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>
      </Section>

      <div className="bg-background">
        <Section title="Un proceso ordenado de principio a fin" description="Cada solicitud pasa por revisión documental, análisis de garantía, análisis financiero y revisión legal antes de presentarse a inversionistas.">
          <Steps
            items={[
              { title: "Registro y solicitud", text: "El solicitante o su broker presenta la necesidad, la garantía y la documentación." },
              { title: "Análisis", text: "Trust Capital verifica documentos, valora la garantía y evalúa la capacidad de pago." },
              { title: "Oportunidad", text: "Los casos aprobados se publican de forma privada a inversionistas autorizados." },
              { title: "Formalización", text: "Se estructura la operación, se formaliza legalmente y se da seguimiento a los pagos." },
            ]}
          />
        </Section>
      </div>

      <Section title="Condiciones comerciales de referencia" description="Parámetros orientativos. Cada operación se evalúa y estructura de forma individual.">
        <dl className="grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {terms.map((t) => (
            <div key={t.label} className="bg-card p-5">
              <dt className="text-sm text-muted-foreground">{t.label}</dt>
              <dd className="tabular mt-1 text-lg font-semibold text-primary">{t.value}</dd>
            </div>
          ))}
        </dl>
        <Disclaimer>
          Condiciones referenciales, no vinculantes. Tasas, plazos y montos dependen del análisis de cada caso. Trust Capital no garantiza
          la aprobación, el desembolso ni la rentabilidad de ninguna operación.
        </Disclaimer>
      </Section>

      <div className="bg-background">
        <Section title="Diseñado para la confianza">
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { icon: ShieldCheck, title: "Información protegida", text: "Documentos privados, acceso por permisos y registro de cada consulta." },
              { icon: FileCheck2, title: "Trazabilidad completa", text: "Cada cambio de estado, aceptación contractual y pago queda registrado." },
              { icon: Building2, title: "Garantías reales", text: "Operaciones respaldadas principalmente por garantías inmobiliarias valoradas." },
            ].map(({ icon: Icon, title, text }) => (
              <div key={title} className="flex gap-4 rounded-xl border border-border bg-card p-5">
                <Icon className="mt-0.5 size-5 shrink-0 text-accent-strong" />
                <div>
                  <h3 className="font-semibold text-primary">{title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>
      </div>

      <div className="pt-14 sm:pt-20">
        <CtaBand title="¿Listo para comenzar?" text="Crea tu cuenta en pocos minutos. Tu información se mantiene privada." href="/registro" label="Crear cuenta" />
      </div>
    </>
  );
}
