"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const links = [
  { href: "/como-funciona", label: "Cómo funciona" },
  { href: "/solicitar-credito", label: "Solicitar crédito" },
  { href: "/brokers", label: "Brokers" },
  { href: "/inversionistas", label: "Inversionistas" },
];

export function SiteHeader() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-card/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Logo />
        <nav className="hidden items-center gap-1 md:flex" aria-label="Principal">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
                pathname === l.href && "text-foreground",
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          <Button asChild variant="ghost" size="sm">
            <Link href="/login">Ingresar</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/registro">Crear cuenta</Link>
          </Button>
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden" aria-label="Abrir menú">
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="bg-sidebar p-5 pt-14">
            <SheetTitle className="sr-only">Menú</SheetTitle>
            <nav className="flex flex-col gap-1" aria-label="Principal móvil">
              {links.map((l) => (
                <Link key={l.href} href={l.href} className="rounded-md px-3 py-3 text-[15px] font-medium text-sidebar-foreground hover:bg-white/5 hover:text-white">
                  {l.label}
                </Link>
              ))}
            </nav>
            <div className="mt-auto flex flex-col gap-2">
              <Button asChild variant="outline" className="border-white/15 bg-transparent text-white hover:bg-white/5">
                <Link href="/login">Ingresar</Link>
              </Button>
              <Button asChild variant="accent">
                <Link href="/registro">Crear cuenta</Link>
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
