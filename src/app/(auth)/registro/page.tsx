import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Handshake, Landmark, LineChart } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { REGISTRATION_TYPES } from "@/lib/domain/roles";
import { getActiveAgreements } from "@/server/agreements";
import { RegistrationForm } from "./registration-form";

export const metadata: Metadata = { title: "Crear cuenta" };

const OPTIONS = [
  { tipo: "solicitante", icon: Landmark, title: "Quiero solicitar un crédito", text: "Financiamiento con garantía de tu propiedad." },
  { tipo: "broker", icon: Handshake, title: "Soy broker o intermediario", text: "Presenta casos de tus clientes y gestiona tus comisiones." },
  { tipo: "inversionista", icon: LineChart, title: "Quiero invertir", text: "Accede a oportunidades privadas con garantía real." },
];

const TITLES = {
  BORROWER: "Registro de solicitante",
  BROKER: "Registro de broker",
  INVESTOR: "Registro de inversionista",
} as const;

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ tipo?: string }> }) {
  const { tipo } = await searchParams;
  const role = tipo ? REGISTRATION_TYPES[tipo] : undefined;

  if (!role) {
    return (
      <div className="w-full max-w-lg">
        <h1 className="text-2xl font-semibold tracking-tight text-primary">¿Cómo deseas utilizar Trust Capital?</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">Elige una opción para continuar con tu registro.</p>
        <div className="mt-8 flex flex-col gap-3">
          {OPTIONS.map(({ tipo: t, icon: Icon, title, text }) => (
            <Link
              key={t}
              href={`/registro?tipo=${t}`}
              className="group flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-colors hover:border-accent/60 hover:bg-accent-soft/40"
            >
              <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary text-white">
                <Icon className="size-5" />
              </span>
              <span className="flex-1">
                <span className="block font-semibold text-primary">{title}</span>
                <span className="mt-0.5 block text-sm text-muted-foreground">{text}</span>
              </span>
              <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-accent-strong" />
            </Link>
          ))}
        </div>
        <p className="mt-8 text-center text-sm text-muted-foreground">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="font-medium text-accent-strong hover:underline">
            Ingresar
          </Link>
        </p>
      </div>
    );
  }

  const agreements = await getActiveAgreements(["terms", "privacy"]);
  const terms = agreements.terms;
  const privacy = agreements.privacy;

  return (
    <div className="w-full max-w-xl">
      <Link href="/registro" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Cambiar tipo de cuenta
      </Link>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight text-primary">{TITLES[role]}</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        {role === "INVESTOR"
          ? "Solo te pedimos lo esencial. La verificación de identidad se completa después, de forma progresiva."
          : role === "BROKER"
            ? "Trust Capital revisará tu perfil antes de que puedas presentar casos formalmente."
            : "El resto de la información se solicita al crear tu expediente de crédito."}
      </p>
      <div className="mt-8">
        {terms && privacy ? (
          <RegistrationForm
            role={role}
            termsVersionId={terms.id}
            termsVersion={terms.version}
            privacyVersionId={privacy.id}
            privacyVersion={privacy.version}
          />
        ) : (
          <Alert tone="warning" title="Registro no disponible">
            No pudimos cargar los términos y la política de privacidad vigentes. Inténtalo de nuevo más tarde.
          </Alert>
        )}
      </div>
    </div>
  );
}
