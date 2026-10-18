"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form-controls";
import { FormStatus } from "@/components/forms/form-status";
import { useActionForm } from "@/components/forms/use-action-form";
import { verifyMfaLoginAction } from "@/server/actions/auth";
import { totpCodeSchema } from "@/lib/validation/auth";

type Values = z.input<typeof totpCodeSchema>;

export function MfaForm({ next }: { next: string }) {
  const form = useForm<Values>({ resolver: zodResolver(totpCodeSchema), defaultValues: { code: "" } });
  const { onSubmit, pending, result } = useActionForm(form, (v) => verifyMfaLoginAction({ code: v.code, next }));
  const error = form.formState.errors.code?.message;
  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <FormStatus result={result} />
      <Field label="Código de 6 dígitos" htmlFor="code" error={error}>
        <Input
          id="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          autoFocus
          className="tabular text-center text-lg tracking-[0.4em]"
          aria-invalid={!!error}
          {...form.register("code")}
        />
      </Field>
      <Button type="submit" size="lg" loading={pending}>
        Verificar
      </Button>
    </form>
  );
}
