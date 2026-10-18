import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function PageHero({
  eyebrow,
  title,
  description,
  primary,
  secondary,
}: {
  eyebrow: string;
  title: string;
  description: string;
  primary?: { href: string; label: string };
  secondary?: { href: string; label: string };
}) {
  return (
    <section className="relative overflow-hidden bg-navy-950 text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.55]"
        style={{
          backgroundImage:
            "radial-gradient(60rem 30rem at 85% -10%, rgba(20,163,154,0.28), transparent 60%), linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)",
          backgroundSize: "auto, 44px 44px, 44px 44px",
        }}
      />
      <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-500">{eyebrow}</p>
        <h1 className="mt-4 max-w-3xl text-[2.1rem] font-semibold leading-[1.1] tracking-tight sm:text-5xl">{title}</h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-sidebar-foreground sm:text-lg">{description}</p>
        {(primary || secondary) && (
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            {primary && (
              <Button asChild variant="accent" size="lg">
                <Link href={primary.href}>
                  {primary.label}
                  <ArrowRight />
                </Link>
              </Button>
            )}
            {secondary && (
              <Button asChild variant="outline" size="lg" className="border-white/15 bg-white/5 text-white hover:bg-white/10">
                <Link href={secondary.href}>{secondary.label}</Link>
              </Button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

export function Section({ title, description, children, className }: { title?: string; description?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20", className)}>
      {title && (
        <div className="mb-10 max-w-2xl">
          <h2 className="text-2xl font-semibold tracking-tight text-primary sm:text-3xl">{title}</h2>
          {description && <p className="mt-3 text-muted-foreground">{description}</p>}
        </div>
      )}
      {children}
    </section>
  );
}

export function FeatureGrid({ items }: { items: { icon: LucideIcon; title: string; text: string }[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map(({ icon: Icon, title, text }) => (
        <div key={title} className="rounded-xl border border-border bg-card p-5">
          <span className="inline-flex size-9 items-center justify-center rounded-lg bg-accent-soft text-accent-strong">
            <Icon className="size-[18px]" />
          </span>
          <h3 className="mt-4 font-semibold text-primary">{title}</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{text}</p>
        </div>
      ))}
    </div>
  );
}

export function Steps({ items }: { items: { title: string; text: string }[] }) {
  return (
    <ol className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {items.map((s, i) => (
        <li key={s.title} className="relative rounded-xl border border-border bg-card p-5">
          <span className="tabular text-sm font-semibold text-accent-strong">{String(i + 1).padStart(2, "0")}</span>
          <h3 className="mt-2 font-semibold text-primary">{s.title}</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{s.text}</p>
        </li>
      ))}
    </ol>
  );
}

export function CtaBand({ title, text, href, label }: { title: string; text: string; href: string; label: string }) {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 sm:pb-24">
      <div className="flex flex-col items-start justify-between gap-6 rounded-2xl bg-primary p-8 text-white sm:flex-row sm:items-center sm:p-10">
        <div>
          <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">{title}</h2>
          <p className="mt-2 max-w-xl text-sm text-sidebar-foreground">{text}</p>
        </div>
        <Button asChild variant="accent" size="lg">
          <Link href={href}>
            {label}
            <ArrowRight />
          </Link>
        </Button>
      </div>
    </section>
  );
}

export function Disclaimer({ children }: { children: React.ReactNode }) {
  return <p className="mt-6 text-xs leading-relaxed text-muted-foreground">{children}</p>;
}
