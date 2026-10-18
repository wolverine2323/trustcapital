import type { Metadata } from "next";
import Link from "next/link";
import { Alert } from "@/components/ui/alert";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { safeNextPath } from "@/lib/validation/auth";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Ingresar" };

const ERRORS: Record<string, string> = {
  config: "La plataforma aún no está conectada a su base de datos. Contacta al administrador.",
  link_invalid: "El enlace no es válido o ya expiró. Solicita uno nuevo.",
  otp_expired: "El enlace expiró. Solicita uno nuevo.",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next, error } = await searchParams;
  const configured = isSupabaseConfigured();
  return (
    <div className="w-full max-w-sm">
      <h1 className="text-2xl font-semibold tracking-tight text-primary">Ingresar</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">Accede a tu panel de Trust Capital.</p>
      <div className="mt-8 flex flex-col gap-4">
        {error && <Alert tone="warning">{ERRORS[error] ?? ERRORS.link_invalid}</Alert>}
        {configured ? <LoginForm next={safeNextPath(next)} /> : !error && <Alert tone="warning">{ERRORS.config}</Alert>}
      </div>
      <p className="mt-8 text-center text-sm text-muted-foreground">
        ¿No tienes cuenta?{" "}
        <Link href="/registro" className="font-medium text-accent-strong hover:underline">
          Crear cuenta
        </Link>
      </p>
    </div>
  );
}
