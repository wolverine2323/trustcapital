import type { Metadata } from "next";
import { BadgeCheck, Eye, FileStack, Handshake, Lock, Wallet } from "lucide-react";
import { CtaBand, Disclaimer, FeatureGrid, PageHero, Section } from "@/components/public/sections";
import { formatMoney, splitCommission } from "@/lib/finance";

export const metadata: Metadata = { title: "Brokers" };

const example = splitCommission(12_500);

export default function BrokersLandingPage() {
  return (
    <>
      <PageHero
        eyebrow="Para brokers e intermediarios"
        title="Presenta casos. Sigue su avance. Cobra con claridad."
        description="Un panel exclusivo para registrar oportunidades de tus clientes, adjuntar documentos y consultar tus comisiones con un esquema simple de dos partes."
        primary={{ href: "/registro?tipo=broker", label: "Registrarme como broker" }}
      />
      <Section title="Comisión 50/50, sin letra pequeña" description="La comisión efectivamente recibida por Trust Capital y elegible para reparto se divide en partes iguales con el broker originador del caso.">
        <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
          <div className="rounded-xl border border-border bg-card p-6">
            <p className="text-sm text-muted-foreground">Ejemplo ilustrativo</p>
            <dl className="tabular mt-4 space-y-3 text-sm">
              <div className="flex justify-between"><dt>Monto del crédito</dt><dd className="font-medium">{formatMoney(500_000, "USD", 0)}</dd></div>
              <div className="flex justify-between"><dt>Comisión recibida por Trust Capital (2,5 %)</dt><dd className="font-medium">{formatMoney(example.distributable, "USD", 0)}</dd></div>
              <div className="flex justify-between border-t border-border pt-3"><dt>Trust Capital (50 %)</dt><dd className="font-semibold text-primary">{formatMoney(example.trustCapital, "USD", 0)}</dd></div>
              <div className="flex justify-between"><dt>Broker originador (50 %)</dt><dd className="font-semibold text-accent-strong">{formatMoney(example.broker, "USD", 0)}</dd></div>
            </dl>
          </div>
          <div className="rounded-xl border border-border bg-muted/50 p-6 text-sm leading-relaxed text-muted-foreground">
            <p className="font-medium text-foreground">Tus referidores, tu responsabilidad</p>
            <p className="mt-2">
              Si trabajas con otros agentes o referidores, sus comisiones salen exclusivamente de tu 50 %. Trust Capital mantiene una sola
              relación de comisión: contigo, como broker originador.
            </p>
            <p className="mt-3">La comisión se devenga y paga únicamente conforme a las condiciones del acuerdo firmado.</p>
          </div>
        </div>
        <Disclaimer>Ejemplo con fines ilustrativos. La comisión comercial cobrada al cliente puede ser distinta de la que recibe Trust Capital.</Disclaimer>
      </Section>
      <div className="bg-background">
        <Section title="Todo en un panel">
          <FeatureGrid
            items={[
              { icon: FileStack, title: "Casos guiados", text: "Formulario por pasos: solicitante, solicitud, garantías, documentos, acuerdo y envío." },
              { icon: Eye, title: "Seguimiento", text: "Quién solicita información, qué documentos faltan y cuál es el siguiente paso." },
              { icon: Wallet, title: "Comisiones visibles", text: "Estimadas, devengadas, aprobadas, pagadas y pendientes, caso por caso." },
              { icon: Handshake, title: "Acuerdo versionado", text: "Aceptas las condiciones una vez y queda registro de la versión aceptada." },
              { icon: Lock, title: "Confidencialidad", text: "Nadie más ve tus casos ni tus comisiones." },
              { icon: BadgeCheck, title: "Aprobación", text: "Trust Capital aprueba a cada broker antes de que presente casos formalmente." },
            ]}
          />
        </Section>
      </div>
      <div className="pt-14 sm:pt-20">
        <CtaBand title="Únete como broker" text="Completa tu registro; nuestro equipo revisará tu perfil." href="/registro?tipo=broker" label="Registrarme" />
      </div>
    </>
  );
}
