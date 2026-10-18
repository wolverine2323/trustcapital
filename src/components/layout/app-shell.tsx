"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Bell, LogOut, Menu, ShieldCheck, User } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ACCOUNT_NAVIGATION, CURRENT_PHASE, ROLE_NAVIGATION, type NavItem } from "@/lib/domain/navigation";
import { ROLE_LABELS, type AppRole } from "@/lib/domain/roles";
import { cn, initials } from "@/lib/utils";
import { signOutAction } from "@/server/actions/auth";

export interface ShellUser {
  name: string;
  email: string;
  role: AppRole;
  unread: number;
}

function isActive(pathname: string, item: NavItem) {
  return item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
}

function NavLink({ item, pathname, badge }: { item: NavItem; pathname: string; badge?: number }) {
  const Icon = item.icon;
  const upcoming = item.phase !== undefined && item.phase > CURRENT_PHASE;
  const active = !upcoming && isActive(pathname, item);
  const base = "group flex items-center gap-3 rounded-md px-3 py-2 text-[14px] font-medium transition-colors";
  if (upcoming) {
    return (
      <span className={cn(base, "cursor-not-allowed text-sidebar-foreground/40")} aria-disabled="true" title={`Disponible en la fase ${item.phase}`}>
        <Icon className="size-[18px] shrink-0" />
        <span className="flex-1 truncate">{item.label}</span>
        <span className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sidebar-foreground/50">
          Fase {item.phase}
        </span>
      </span>
    );
  }
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        base,
        active ? "bg-sidebar-active text-sidebar-active-foreground" : "text-sidebar-foreground hover:bg-white/5 hover:text-white",
      )}
    >
      <Icon className={cn("size-[18px] shrink-0", active ? "text-teal-500" : "text-sidebar-foreground/70 group-hover:text-white")} />
      <span className="flex-1 truncate">{item.label}</span>
      {badge ? (
        <span className="tabular rounded-full bg-teal-500 px-1.5 text-[11px] font-semibold leading-5 text-white">{badge > 99 ? "99+" : badge}</span>
      ) : null}
    </Link>
  );
}

function SidebarContents({ user, pathname }: { user: ShellUser; pathname: string }) {
  const sections = ROLE_NAVIGATION[user.role];
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 shrink-0 items-center px-5">
        <Logo href="/app" inverted />
      </div>
      <div className="px-5 pb-3">
        <span className="inline-flex items-center rounded-full border border-white/10 px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wider text-sidebar-foreground/80">
          {ROLE_LABELS[user.role]}
        </span>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 pb-4" aria-label="Navegación de la aplicación">
        {sections.map((section, i) => (
          <div key={section.title ?? i} className={cn(i > 0 && "mt-5")}>
            {section.title && <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/45">{section.title}</p>}
            <div className="flex flex-col gap-0.5">
              {section.items.map((item) => (
                <NavLink key={item.href} item={item} pathname={pathname} />
              ))}
            </div>
          </div>
        ))}
        <div className="mt-5 border-t border-sidebar-border pt-4">
          <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/45">Cuenta</p>
          <div className="flex flex-col gap-0.5">
            {ACCOUNT_NAVIGATION.map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} badge={item.href === "/app/notificaciones" ? user.unread : undefined} />
            ))}
          </div>
        </div>
      </nav>
      <div className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-3 rounded-md px-2 py-2">
          <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-navy-700 text-xs font-semibold text-white">{initials(user.name)}</span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium text-white">{user.name}</span>
            <span className="block truncate text-xs text-sidebar-foreground/70">{user.email}</span>
          </span>
        </div>
      </div>
    </div>
  );
}

export function AppShell({ user, children }: { user: ShellUser; children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-dvh bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 bg-sidebar lg:block">
        <SidebarContents user={user} pathname={pathname} />
      </aside>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="bg-sidebar">
          <SheetTitle className="sr-only">Menú de navegación</SheetTitle>
          <SidebarContents user={user} pathname={pathname} />
        </SheetContent>
      </Sheet>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-2 border-b border-border bg-card/90 px-4 backdrop-blur-md sm:px-6">
          <Button variant="ghost" size="icon" className="-ml-2 lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Abrir menú">
            <Menu className="size-5" />
          </Button>
          <div className="lg:hidden">
            <Logo href="/app" className="[&>span:last-child]:hidden sm:[&>span:last-child]:flex" />
          </div>
          <div className="ml-auto flex items-center gap-1">
            <Button asChild variant="ghost" size="icon" aria-label={`Notificaciones${user.unread ? `: ${user.unread} sin leer` : ""}`}>
              <Link href="/app/notificaciones" className="relative">
                <Bell className="size-5" />
                {user.unread > 0 && <span className="absolute right-2 top-2 size-2 rounded-full bg-teal-500 ring-2 ring-card" />}
              </Link>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="ml-1 inline-flex size-9 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white" aria-label="Menú de usuario">
                  {initials(user.name)}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>
                  <span className="block truncate font-medium">{user.name}</span>
                  <span className="block truncate text-xs text-muted-foreground">{user.email}</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/app/perfil"><User /> Mi perfil</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/app/seguridad"><ShieldCheck /> Seguridad</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <form action={signOutAction}>
                  <DropdownMenuItem asChild>
                    <button type="submit" className="w-full"><LogOut /> Cerrar sesión</button>
                  </DropdownMenuItem>
                </form>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      </div>
    </div>
  );
}
