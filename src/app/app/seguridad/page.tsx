import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { NewPasswordForm } from "@/components/forms/new-password-form";
import { PageHeader } from "@/components/shared/page-header";
import { requireSession } from "@/server/session";
import { MfaEnroll } from "./mfa-enroll";

export const metadata: Metadata = { title: "Seguridad" };

export default async function SecurityPage({ searchParams }: { searchParams: Promise<{ mfa?: string }> }) {
  const session = await requireSession();
  const { mfa } = await searchParams;
  const isAdmin = session.roles.includes("ADMIN");

  return (
    <>
      <PageHeader title="Seguridad" description="Protege el acceso a tu cuenta." />
      {mfa === "required" && !session.hasVerifiedMfa && (
        <Alert tone="warning" title="Verificación en dos pasos obligatoria" className="mb-6">
          Para acceder al panel administrativo debes activar la verificación en dos pasos.
        </Alert>
      )}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <CardTitle>Verificación en dos pasos</CardTitle>
              {session.hasVerifiedMfa ? <Badge tone="success">Activa</Badge> : <Badge tone={isAdmin ? "warning" : "neutral"}>{isAdmin ? "Obligatoria" : "Recomendada"}</Badge>}
            </div>
            <CardDescription>Un código temporal de tu teléfono además de tu contraseña.</CardDescription>
          </CardHeader>
          <CardContent>
            {session.hasVerifiedMfa ? (
              <div className="flex items-start gap-3 text-sm text-muted-foreground">
                <ShieldCheck className="mt-0.5 size-5 shrink-0 text-success" />
                <p>
                  Tu cuenta está protegida con una aplicación de autenticación.
                  {session.aal !== "aal2" && " En esta sesión aún no has ingresado el código."}
                </p>
              </div>
            ) : (
              <MfaEnroll redirectTo={isAdmin ? "/app/admin" : undefined} />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Cambiar contraseña</CardTitle>
            <CardDescription>Usa una contraseña única de al menos 10 caracteres.</CardDescription>
          </CardHeader>
          <CardContent>
            <NewPasswordForm />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
