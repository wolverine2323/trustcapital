import type { Metadata } from "next";
import { ShieldAlert } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { requireSession } from "@/server/session";
import { signOutAction } from "@/server/actions/auth";

export const metadata: Metadata = { title: { default: "Panel", template: "%s · Trust Capital" }, robots: { index: false } };

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();

  if (!session.activeRole) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background px-4">
        <div className="max-w-md rounded-xl border border-border bg-card p-6 text-center">
          <ShieldAlert className="mx-auto size-8 text-warning" />
          <h1 className="mt-3 text-lg font-semibold text-primary">Tu cuenta no tiene un rol asignado</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Trust Capital debe asignarte un perfil antes de que puedas usar la plataforma. Si crees que es un error, contacta al equipo de
            Trust Capital.
          </p>
          <form action={signOutAction} className="mt-5">
            <Button type="submit" variant="outline">Cerrar sesión</Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <AppShell
      user={{
        name: session.profile?.full_name ?? session.email,
        email: session.email,
        role: session.activeRole,
        unread: session.unreadNotifications,
      }}
    >
      {children}
    </AppShell>
  );
}
