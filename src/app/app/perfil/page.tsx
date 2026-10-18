import type { Metadata } from "next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { RoleBadge } from "@/components/shared/role-badge";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import { requireSession } from "@/server/session";
import { ProfileForm } from "./profile-form";

export const metadata: Metadata = { title: "Mi perfil" };

const KIND_LABEL: Record<string, string> = { terms: "Términos y condiciones", privacy: "Política de privacidad", broker_intermediation: "Acuerdo de intermediación" };

export default async function ProfilePage() {
  const session = await requireSession();
  const profile = session.profile!;
  const supabase = await createClient();
  const { data: consents } = await supabase
    .from("consent_records")
    .select("id, kind, accepted_at, agreement_versions(version)")
    .eq("user_id", session.userId)
    .order("accepted_at", { ascending: false });

  return (
    <>
      <PageHeader title="Mi perfil" description="Tus datos de contacto y el registro de tus aceptaciones." />
      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Datos personales</CardTitle>
          </CardHeader>
          <CardContent>
            <ProfileForm
              email={session.email}
              defaults={{ fullName: profile.full_name, phone: profile.phone ?? "", country: profile.country, personType: profile.person_type }}
            />
          </CardContent>
        </Card>
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Cuenta</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-2.5 text-sm">
                <div className="flex items-center justify-between gap-4"><dt className="text-muted-foreground">Rol</dt><dd><RoleBadge role={session.activeRole} /></dd></div>
                <div className="flex items-center justify-between gap-4"><dt className="text-muted-foreground">Miembro desde</dt><dd>{formatDate(profile.created_at)}</dd></div>
                <div className="flex items-center justify-between gap-4"><dt className="text-muted-foreground">Verificación en dos pasos</dt><dd>{session.hasVerifiedMfa ? "Activa" : "Inactiva"}</dd></div>
              </dl>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Aceptaciones</CardTitle>
              <CardDescription>Versiones de documentos que aceptaste.</CardDescription>
            </CardHeader>
            <CardContent>
              {consents?.length ? (
                <ul className="space-y-2.5 text-sm">
                  {consents.map((c) => {
                    const av = c.agreement_versions as { version: string } | { version: string }[] | null;
                    const version = Array.isArray(av) ? av[0]?.version : av?.version;
                    return (
                      <li key={c.id} className="flex items-start justify-between gap-4">
                        <span>
                          {KIND_LABEL[c.kind] ?? c.kind}
                          {version && <span className="block text-xs text-muted-foreground">Versión {version}</span>}
                        </span>
                        <span className="shrink-0 text-xs text-muted-foreground">{formatDate(c.accepted_at)}</span>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">Sin aceptaciones registradas.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
