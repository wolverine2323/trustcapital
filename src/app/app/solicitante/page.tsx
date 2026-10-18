import type { Metadata } from "next";
import { FileText, FolderOpen, Landmark, MessageSquare } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checklist } from "@/components/shared/checklist";
import { EmptyState } from "@/components/shared/empty-state";
import { KpiCard, KpiGrid } from "@/components/shared/kpi";
import { PageHeader } from "@/components/shared/page-header";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/server/session";

export const metadata: Metadata = { title: "Inicio" };

export default async function BorrowerDashboardPage() {
  const session = await requireRole("BORROWER");
  const supabase = await createClient();
  const { data: borrower } = await supabase
    .from("borrowers")
    .select("legal_name, identification, economic_activity, province")
    .eq("user_id", session.userId)
    .maybeSingle<{ legal_name: string; identification: string | null; economic_activity: string | null; province: string | null }>();

  const firstName = session.profile?.full_name.split(" ")[0] ?? "";

  return (
    <>
      <PageHeader title={`Hola, ${firstName}`} description="Aquí verás el estado de tus solicitudes de financiamiento." />
      <KpiGrid>
        <KpiCard label="Solicitudes activas" value="0" icon={FileText} />
        <KpiCard label="Documentos pendientes" value="0" icon={FolderOpen} />
        <KpiCard label="Mensajes" value={String(session.unreadNotifications)} icon={MessageSquare} hint="Sin leer" />
        <KpiCard label="Operaciones formalizadas" value="0" icon={Landmark} tone="accent" />
      </KpiGrid>
      <div className="mt-6 grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Mis solicitudes</CardTitle>
            <CardDescription>Cada solicitud muestra su estado y el siguiente paso.</CardDescription>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon={FileText}
              title="Todavía no tienes solicitudes"
              description="Muy pronto podrás crear tu solicitud en cinco pasos: monto, uso de fondos, garantía, fuente de pago y documentos."
            />
          </CardContent>
        </Card>
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Próximos pasos</CardTitle>
            </CardHeader>
            <CardContent>
              <Checklist
                items={[
                  { label: "Crear tu cuenta", state: "done" },
                  { label: "Confirmar tu correo", state: "done" },
                  { label: "Crear tu solicitud de crédito", state: "pending" },
                  { label: "Registrar la garantía y adjuntar documentos", state: "pending" },
                ]}
              />
            </CardContent>
          </Card>
          {borrower && (
            <Card>
              <CardHeader>
                <CardTitle>Datos del solicitante</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Nombre</dt><dd className="text-right font-medium">{borrower.legal_name}</dd></div>
                  <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Identificación</dt><dd className="text-right">{borrower.identification ?? "Pendiente"}</dd></div>
                  <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Actividad</dt><dd className="text-right">{borrower.economic_activity ?? "Pendiente"}</dd></div>
                  <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Provincia</dt><dd className="text-right">{borrower.province ?? "Pendiente"}</dd></div>
                </dl>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
