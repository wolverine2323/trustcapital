"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ShieldCheck, Smartphone } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form-controls";
import { startTotpEnrollmentAction, verifyTotpEnrollmentAction } from "@/server/actions/auth";

export function MfaEnroll({ redirectTo }: { redirectTo?: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [enrollment, setEnrollment] = useState<{ factorId: string; qrCode: string; secret: string } | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <Alert tone="success" title="Verificación en dos pasos activada">
        A partir de ahora te pediremos un código al ingresar.
      </Alert>
    );
  }

  if (!enrollment) {
    return (
      <div className="flex flex-col items-start gap-3">
        {error && <Alert tone="danger">{error}</Alert>}
        <Button
          loading={pending}
          onClick={() =>
            start(async () => {
              setError(null);
              const r = await startTotpEnrollmentAction();
              if (r.ok && r.data) setEnrollment(r.data);
              else if (!r.ok) setError(r.message);
            })
          }
        >
          <Smartphone /> Configurar autenticador
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
        <li>Abre una aplicación de autenticación (Google Authenticator, Microsoft Authenticator, 1Password, etc.).</li>
        <li>Escanea el código QR o ingresa la clave manualmente.</li>
        <li>Escribe el código de 6 dígitos que genera la aplicación.</li>
      </ol>
      <div className="flex flex-col items-start gap-4 sm:flex-row">
        {/* eslint-disable-next-line @next/next/no-img-element -- QR SVG generado por Supabase (data URI) */}
        <img src={enrollment.qrCode} alt="Código QR para tu aplicación de autenticación" className="size-44 rounded-lg border border-border bg-white p-2" />
        <div className="flex min-w-0 flex-col gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">Clave manual</span>
          <code className="break-all rounded-md bg-muted px-2.5 py-1.5 font-mono text-xs">{enrollment.secret}</code>
        </div>
      </div>
      <form
        className="flex flex-col gap-3 sm:max-w-xs"
        onSubmit={(e) => {
          e.preventDefault();
          start(async () => {
            setError(null);
            const r = await verifyTotpEnrollmentAction({ factorId: enrollment.factorId, code });
            if (r.ok) {
              setDone(true);
              if (redirectTo) router.push(redirectTo);
              router.refresh();
            } else setError(r.message);
          });
        }}
      >
        <Field label="Código de verificación" htmlFor="mfa-code" error={error ?? undefined}>
          <Input
            id="mfa-code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            className="tabular text-center tracking-[0.4em]"
            aria-invalid={!!error}
          />
        </Field>
        <Button type="submit" loading={pending} disabled={code.length !== 6}>
          <ShieldCheck /> Activar
        </Button>
      </form>
    </div>
  );
}
