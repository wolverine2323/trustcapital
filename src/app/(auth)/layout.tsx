import { CheckCircle2 } from "lucide-react";
import { Logo } from "@/components/brand/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
      <aside className="relative hidden overflow-hidden bg-navy-950 p-10 text-white lg:flex lg:flex-col">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(40rem 24rem at 100% 0%, rgba(20,163,154,0.25), transparent 60%), linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
            backgroundSize: "auto, 40px 40px, 40px 40px",
          }}
        />
        <div className="relative">
          <Logo inverted />
        </div>
        <div className="relative mt-auto max-w-md">
          <p className="text-2xl font-semibold leading-snug tracking-tight">Capital privado. Garantías reales. Oportunidades estructuradas.</p>
          <ul className="mt-8 space-y-3 text-sm text-sidebar-foreground">
            {["Información privada y protegida", "Cada paso documentado y trazable", "Procesos claros para cada participante"].map((t) => (
              <li key={t} className="flex items-center gap-2.5">
                <CheckCircle2 className="size-4 text-teal-500" /> {t}
              </li>
            ))}
          </ul>
          <p className="mt-10 text-xs leading-relaxed text-sidebar-foreground/60">
            Trust Capital no es un banco ni capta depósitos del público. No se garantizan rendimientos, aprobaciones ni desembolsos.
          </p>
        </div>
      </aside>
      <main className="flex flex-col bg-card">
        <div className="flex h-16 items-center px-4 sm:px-8 lg:hidden">
          <Logo />
        </div>
        <div className="flex flex-1 items-start justify-center px-4 py-8 sm:px-8 lg:items-center lg:py-12">{children}</div>
      </main>
    </div>
  );
}
