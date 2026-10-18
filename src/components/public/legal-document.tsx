import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import type { AgreementVersion } from "@/server/agreements";

export function LegalDocument({ doc, fallbackTitle }: { doc?: AgreementVersion; fallbackTitle: string }) {
  if (!doc) {
    return (
      <article className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        <h1 className="text-3xl font-semibold tracking-tight text-primary">{fallbackTitle}</h1>
        <Alert tone="warning" className="mt-6" title="Documento no disponible">
          No pudimos cargar la versión vigente en este momento. Inténtalo de nuevo más tarde.
        </Alert>
      </article>
    );
  }
  const paragraphs = doc.body.split(/\n{2,}/);
  return (
    <article className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="neutral">Versión {doc.version}</Badge>
        {doc.is_legal_draft && <Badge tone="warning">Borrador pendiente de revisión legal</Badge>}
        {doc.published_at && <span className="text-xs text-muted-foreground">Vigente desde {formatDate(doc.published_at)}</span>}
      </div>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight text-primary">{doc.title}</h1>
      <div className="mt-8 space-y-4 text-[15px] leading-relaxed text-foreground/85">
        {paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
      <p className="mt-10 break-all text-xs text-muted-foreground">Huella del documento (SHA-256): {doc.body_hash}</p>
    </article>
  );
}
