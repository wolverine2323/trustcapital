import type { Metadata } from "next";
import Link from "next/link";
import { Bell } from "lucide-react";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { createClient } from "@/lib/supabase/server";
import { cn, formatDate } from "@/lib/utils";
import { requireSession } from "@/server/session";
import { MarkAllReadButton, MarkReadButton } from "./notification-actions";

export const metadata: Metadata = { title: "Notificaciones" };

export default async function NotificationsPage() {
  const session = await requireSession();
  const supabase = await createClient();
  const { data: items } = await supabase
    .from("notifications")
    .select("id, title, body, link, read_at, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <>
      <PageHeader
        title="Notificaciones"
        description={session.unreadNotifications ? `${session.unreadNotifications} sin leer` : "Estás al día."}
        actions={<MarkAllReadButton disabled={!session.unreadNotifications} />}
      />
      <Card className="overflow-hidden">
        {!items?.length ? (
          <EmptyState icon={Bell} title="No tienes notificaciones" />
        ) : (
          <ul className="divide-y divide-border">
            {items.map((n) => (
              <li key={n.id} className={cn("flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center", !n.read_at && "bg-accent-soft/40")}>
                <span className={cn("mt-1.5 hidden size-2 shrink-0 rounded-full sm:block", n.read_at ? "bg-transparent" : "bg-teal-500")} aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className={cn("text-sm", !n.read_at && "font-semibold")}>
                    {n.link && n.link.startsWith("/") ? <Link href={n.link} className="hover:underline">{n.title}</Link> : n.title}
                  </p>
                  {n.body && <p className="mt-0.5 text-sm text-muted-foreground">{n.body}</p>}
                  <p className="mt-1 text-xs text-muted-foreground">{formatDate(n.created_at)}</p>
                </div>
                {!n.read_at && <MarkReadButton id={n.id} />}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
