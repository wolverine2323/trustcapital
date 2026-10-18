"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form-controls";
import { FormStatus } from "@/components/forms/form-status";
import { useActionForm } from "@/components/forms/use-action-form";
import { requestPasswordResetAction } from "@/server/actions/auth";
import { emailSchema } from "@/lib/validation/auth";

export function RecoverForm() {
  const form = useForm<z.input<typeof emailSchema>>({ resolver: zodResolver(emailSchema), defaultValues: { email: "" } });
  const { onSubmit, pending, result } = useActionForm(form, requestPasswordResetAction);
  const error = form.formState.errors.email?.message;
  if (result?.ok) return <FormStatus result={result} />;
  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <FormStatus result={result} />
      <Field label="Correo electrónico" htmlFor="email" error={error}>
        <Input id="email" type="email" autoComplete="email" inputMode="email" aria-invalid={!!error} {...form.register("email")} />
      </Field>
      <Button type="submit" size="lg" loading={pending}>
        Enviar enlace
      </Button>
    </form>
  );
}
