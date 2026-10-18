import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { BrokerStatusBadge, RoleBadge } from "@/components/shared/role-badge";
import { APP_ROLES, ROLE_LABELS, isAppRole } from "@/lib/domain/roles";
import { createClient } from "@/lib/supabase/server";
import { cn, formatDate } from "@/lib/utils";
import { requireRole } from "@/server/session";

export const metadata: Metadata = { title: "Usuarios" };

const PAGE_SIZE = 25;

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<{ rol?: string; page?: string }> }) {
  await requireRole("ADMIN");
  const { rol, page: pageParam } = await searchParams;
  const role = isAppRole(rol) ? rol : null;
  const page = Math.max(1, Number.parseInt(pageParam ?? "1", 10) || 1);

  const supabase = await createClient();
  let query = supabase
    .from("profiles")
    .select("id, full_name, email, phone, country, primary_role, created_at, brokers(status)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (role) query = query.eq("primary_role", role);
  const { data, count, error } = await query;
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  const filterHref = (r: string | null) => (r ? `/app/admin/usuarios?rol=${r}` : "/app/admin/usuarios");
  const pageHref = (p: number) => `/app/admin/usuarios?${new URLSearchParams({ ...(role ? { rol: role } : {}), page: String(p) })}`;

  return (
    <>
      <PageHeader title="Usuarios" description={`${count ?? 0} cuentas${role ? ` con rol ${ROLE_LABELS[role].toLowerCase()}` : ""}.`} />
      <div className="mb-4 flex flex-wrap gap-2" role="tablist" aria-label="Filtrar por rol">
        {[null, ...APP_ROLES].map((r) => (
          <Link
            key={r ?? "all"}
            href={filterHref(r)}
            role="tab"
            aria-selected={role === r}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
              role === r ? "border-primary bg-primary text-white" : "border-border bg-card text-muted-foreground hover:text-foreground",
            )}
          >
            {r ? ROLE_LABELS[r] : "Todos"}
          </Link>
        ))}
      </div>
      <Card className="overflow-hidden">
        {error ? (
          <EmptyState title="No pudimos cargar los usuarios" description="Inténtalo de nuevo." />
        ) : !data?.length ? (
          <EmptyState icon={Users} title="No hay usuarios para este filtro" />
        ) : (
          <>
            <div className="hidden md:block">
              <table className="w-full text-sm">
                <thead className="bg-muted/60 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3">Nombre</th>
                    <th className="px-5 py-3">Contacto</th>
                    <th className="px-5 py-3">Rol</th>
                    <th className="px-5 py-3">Estado</th>
                    <th className="px-5 py-3 text-right">Registro</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.map((u) => {
                    const broker = Array.isArray(u.brokers) ? u.brokers[0] : u.brokers;
                    return (
                      <tr key={u.id} className="hover:bg-muted/30">
                        <td className="px-5 py-3 font-medium">{u.full_name}</td>
                        <td className="px-5 py-3 text-muted-foreground">
                          <span className="block">{u.email}</span>
                          <span className="block text-xs">{u.phone ?? "—"} · {u.country}</span>
                        </td>
                        <td className="px-5 py-3"><RoleBadge role={u.primary_role} /></td>
                        <td className="px-5 py-3">{broker ? <BrokerStatusBadge status={broker.status} /> : <span className="text-muted-foreground">—</span>}</td>
                        <td className="tabular px-5 py-3 text-right text-muted-foreground">{formatDate(u.created_at)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <ul className="divide-y divide-border md:hidden">
              {data.map((u) => {
                const broker = Array.isArray(u.brokers) ? u.brokers[0] : u.brokers;
                return (
                  <li key={u.id} className="flex flex-col gap-1.5 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate font-medium">{u.full_name}</span>
                      <RoleBadge role={u.primary_role} />
                    </div>
                    <span className="truncate text-sm text-muted-foreground">{u.email}</span>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{formatDate(u.created_at)}</span>
                      {broker && <BrokerStatusBadge status={broker.status} />}
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </Card>
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Página {page} de {totalPages}</span>
          <div className="flex gap-2">
            {page > 1 ? (
              <Button asChild variant="outline" size="sm"><Link href={pageHref(page - 1)}><ChevronLeft /> Anterior</Link></Button>
            ) : (
              <Button variant="outline" size="sm" disabled><ChevronLeft /> Anterior</Button>
            )}
            {page < totalPages ? (
              <Button asChild variant="outline" size="sm"><Link href={pageHref(page + 1)}>Siguiente <ChevronRight /></Link></Button>
            ) : (
              <Button variant="outline" size="sm" disabled>Siguiente <ChevronRight /></Button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
