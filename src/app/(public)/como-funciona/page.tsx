import type { Metadata } from "next";
import { CtaBand, Disclaimer, PageHero, Section, Steps } from "@/components/public/sections";

export const metadata: Metadata = { title: "Cómo funciona" };

export default function HowItWorksPage() {
  return (
    <>
      <PageHero
        eyebrow="Cómo funciona"
        title="Un marketplace privado con reglas claras"
        description="Trust Capital origina, evalúa, estructura y da seguimiento a operaciones de crédito privado respaldadas por garantías reales. Ninguna solicitud se publica sin revisión."
      />
      <Section title="Las etapas de una operación">
        <Steps
          items={[
            { title: "Registro", text: "Solicitantes y brokers registran la solicitud, la garantía y los documentos." },
            { title: "Validación y revisión", text: "Revisión documental, análisis de la garantía y análisis financiero." },
            { title: "Revisión legal y preaprobación", text: "Se confirman la situación registral, los gravámenes y la estructura." },
            { title: "Publicación privada", text: "Solo el administrador publica oportunidades, y solo con datos autorizados." },
          ]}
        />
        <div className="mt-4">
          <Steps
            items={[
              { title: "Intereses", text: "Inversionistas autorizados manifiestan interés. Esto no constituye una inversión." },
              { title: "Negociación", text: "Se confirman montos, condiciones y la participación de cada inversionista." },
              { title: "Formalización", text: "Contratos, garantías y, cuando aplica, estructuras fiduciarias." },
              { title: "Desembolso y seguimiento", text: "Calendario de pagos, registro de cuotas y cierre de la operación." },
            ]}
          />
        </div>
      </Section>
      <div className="bg-background">
        <Section title="Lo que Trust Capital es — y lo que no es">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="font-semibold text-primary">Sí somos</h3>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li>Un administrador central de originación, análisis y estructuración.</li>
                <li>Un canal privado entre necesidades de financiamiento y capital privado.</li>
                <li>Responsables de mantener la información documentada y trazable.</li>
              </ul>
            </div>
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="font-semibold text-primary">No somos</h3>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li>Un banco ni una entidad captadora de depósitos del público.</li>
                <li>Garantes de rendimientos, aprobaciones o desembolsos.</li>
                <li>Custodios de fondos: la plataforma no ejecuta transferencias.</li>
              </ul>
            </div>
          </div>
          <Disclaimer>Toda cifra mostrada antes de la formalización es una estimación.</Disclaimer>
        </Section>
      </div>
      <div className="pt-14 sm:pt-20">
        <CtaBand title="Empieza hoy" text="Crea tu cuenta y elige cómo deseas participar." href="/registro" label="Crear cuenta" />
      </div>
    </>
  );
}
