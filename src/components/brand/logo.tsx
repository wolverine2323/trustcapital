import Link from "next/link";
import { cn } from "@/lib/utils";

/** Marca provisional de Trust Capital. Reemplazar por el logo oficial cuando esté disponible. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={cn("size-8", className)}>
      <rect width="32" height="32" rx="8" fill="var(--tc-navy-900)" />
      <path d="M9 10.5h14" stroke="var(--tc-teal-500)" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M16 10.5v12" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M11.5 16.5c0 3.4 2 6 4.5 6s4.5-2.6 4.5-6" stroke="#fff" strokeOpacity=".45" strokeWidth="1.6" fill="none" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({ href = "/", inverted = false, className }: { href?: string; inverted?: boolean; className?: string }) {
  return (
    <Link href={href} className={cn("inline-flex items-center gap-2.5", className)} aria-label="Trust Capital — inicio">
      <LogoMark />
      <span className={cn("flex flex-col leading-none", inverted ? "text-white" : "text-primary")}>
        <span className="text-[15px] font-semibold tracking-tight">Trust Capital</span>
        <span className={cn("mt-0.5 text-[10.5px] font-medium uppercase tracking-[0.14em]", inverted ? "text-teal-500" : "text-accent-strong")}>
          Marketplace
        </span>
      </span>
    </Link>
  );
}
