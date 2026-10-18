import Link from "next/link";
import { Logo } from "@/components/brand/logo";

export function SiteFooter() {
  return (
    <footer className="border-t border-white/5 bg-navy-950 text-sidebar-foreground">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="flex flex-col gap-4">
          <Logo inverted />
          <p className="max-w-sm text-sm leading-relaxed text-sidebar-foreground/80">
            Plataforma privada que conecta solicitantes de financiamiento, brokers e inversionistas en operaciones de crédito
            respaldadas por garantías reales en Costa Rica.
          </p>
        </div>
        <div className="flex flex-col gap-2 text-sm">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-white/50">Plataforma</p>
          <Link href="/como-funciona" className="hover:text-white">Cómo funciona</Link>
          <Link href="/solicitar-credito" className="hover:text-white">Solicitar crédito</Link>
          <Link href="/brokers" className="hover:text-white">Para brokers</Link>
          <Link href="/inversionistas" className="hover:text-white">Para inversionistas</Link>
        </div>
        <div className="flex flex-col gap-2 text-sm">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-white/50">Legal</p>
          <Link href="/terminos" className="hover:text-white">Términos y condiciones</Link>
          <Link href="/privacidad" className="hover:text-white">Política de privacidad</Link>
          <a href="https://trustcapital.credit" className="hover:text-white" rel="noopener">trustcapital.credit</a>
        </div>
      </div>
      <div className="border-t border-white/5">
        <p className="mx-auto max-w-6xl px-4 py-6 text-xs leading-relaxed text-sidebar-foreground/60 sm:px-6">
          Trust Capital no es un banco ni una entidad captadora de depósitos del público y no garantiza rendimientos, aprobaciones
          ni desembolsos. Los rendimientos y condiciones mostrados son estimaciones referenciales sujetas a análisis, formalización
          y documentación contractual. El acceso a oportunidades está sujeto a autorización. © {new Date().getFullYear()} Trust Capital.
        </p>
      </div>
    </footer>
  );
}
