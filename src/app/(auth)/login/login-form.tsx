"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form-controls";
import { Alert } from "@/components/ui/alert";
import { FormStatus } from "@/components/forms/form-status";
import { useActionForm } from "@/components/forms/use-action-form";
import { resendConfirmationAction, signInAction } from "@/server/actions/auth";
import { signInSchema } from "@/lib/validation/auth";

type Values = z.input<typeof signInSchema>;

export function LoginForm({ next }: { next?: string }) {
  const form = useForm<Values, unknown, z.output<typeof signInSchema>>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "", next },
  });
  const { onSubmit, pending, result } = useActionForm(form, signInAction);
  const [resendPending, startResend] = useTransition();
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const errors = form.formState.errors;
  const needsConfirmation = result && !result.ok && result.code === "email_not_confirmed";

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <FormStatus result={result} />
      {needsConfirmation && (
        <div className="-mt-1">
          <Button
            type="button"
            variant="link"
            size="sm"
            loading={resendPending}
            onClick={() =>
              startResend(async () => {
                const r = await resendConfirmationAction({ email: form.getValues("email") });
                setResendMessage(r.message ?? null);
              })
            }
          >
            Reenviar correo de confirmación
          </Button>
          {resendMessage && <Alert tone="info" className="mt-2">{resendMessage}</Alert>}
        </div>
      )}
      <Field label="Correo electrónico" htmlFor="email" error={errors.email?.message}>
        <Input id="email" type="email" autoComplete="email" inputMode="email" aria-invalid={!!errors.email} {...form.register("email")} />
      </Field>
      <Field label="Contraseña" htmlFor="password" error={errors.password?.message}>
        <Input id="password" type="password" autoComplete="current-password" aria-invalid={!!errors.password} {...form.register("password")} />
      </Field>
      <div className="flex justify-end">
        <Link href="/recuperar-contrasena" className="text-sm font-medium text-accent-strong hover:underline">
          ¿Olvidaste tu contraseña?
        </Link>
      </div>
      <Button type="submit" size="lg" loading={pending}>
        Ingresar
      </Button>
    </form>
  );
}
