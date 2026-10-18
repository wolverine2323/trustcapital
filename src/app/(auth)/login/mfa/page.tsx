import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/validation/auth";
import { signOutAction } from "@/server/actions/auth";
import { Button } from "@/components/ui/button";
import { MfaForm } from "./mfa-form";

export const metadata: Metadata = { title: "Verificación en dos pasos" };

export default async function MfaPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal?.currentLevel === "aal2" || aal?.nextLevel !== "aal2") redirect(safeNextPath(next));

  return (
    <div className="w-full max-w-sm">
      <span className="inline-flex size-10 items-center justify-center rounded-lg bg-accent-soft text-accent-strong">
        <ShieldCheck className="size-5" />
      </span>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight text-primary">Verificación en dos pasos</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">Ingresa el código que muestra tu aplicación de autenticación.</p>
      <div className="mt-8">
        <MfaForm next={safeNextPath(next)} />
      </div>
      <form action={signOutAction} className="mt-6 text-center">
        <Button type="submit" variant="link" size="sm" className="text-muted-foreground">
          Cancelar y cerrar sesión
        </Button>
      </form>
    </div>
  );
}
