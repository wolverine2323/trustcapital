import type { Metadata } from "next";
import { Clock, FileText, Home, Landmark, Scale, Wallet } from "lucide-react";
import { CtaBand, Disclaimer, FeatureGrid, PageHero, Section } from "@/components/public/sections";

export const metadata: Metadata = { title: "Solicitar crédito" };

export default function BorrowerLandingPage() {
  return (
    <>
      <PageHero
        eyebrow="Para solicitantes"
        title="Financiamiento privado respaldado por tu propiedad"
        description="Personas físicas y empresas que necesitan capital y ofrecen garantías inmobiliarias. Un proceso sencillo, con seguimiento claro en cada etapa."
        primary={{ href: "/registro?tipo=solicitante", label: "Solicitar crédito" }}
        secondary={{ href: "/como-funciona", label: "Ver el proceso" }}
      />
      <Section title="Qué necesitas para empezar">
        <FeatureGrid
          items={[
            { icon: Wallet, title: "Monto y uso de fondos", text: "Cuánto necesitas y para qué: desarrollo, capital de trabajo, refinanciamiento o crédito puente." },
            { icon: Home, title: "Garantía", text: "Una o varias propiedades: ubicación, finca, plano, avalúo e hipotecas existentes." },
            { icon: Landmark, title: "Fuente de repago", text: "Cómo se pagarán los intereses mensuales y el capital al vencimiento." },
            { icon: FileText, title: "Documentación", text: "Avalúo, certificación registral, plano catastrado, identificación y estados financieros." },
            { icon: Clock, title: "Evaluación ágil", text: "Objetivo de evaluación preliminar en 48 horas una vez completa la información." },
            { icon: Scale, title: "Condiciones claras", text: "Conocerás comisiones, gastos y neto a desembolsar antes de formalizar." },
          ]}
        />
        <Disclaimer>La presentación de una solicitud no garantiza su aprobación ni su financiamiento.</Disclaimer>
      </Section>
      <CtaBand title="Crea tu solicitud" text="Registrarte toma pocos minutos. Puedes guardar tu avance y completarlo después." href="/registro?tipo=solicitante" label="Comenzar" />
    </>
  );
}
