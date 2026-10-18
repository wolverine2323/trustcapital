"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form-controls";
import { FormStatus } from "@/components/forms/form-status";
import { useActionForm } from "@/components/forms/use-action-form";
import { updatePasswordAction } from "@/server/actions/auth";
import { newPasswordSchema } from "@/lib/validation/auth";

export function NewPasswordForm({ onDoneHref }: { onDoneHref?: string }) {
  const form = useForm<z.input<typeof newPasswordSchema>>({
    resolver: zodResolver(newPasswordSchema),
    defaultValues: { password: "", confirm: "" },
  });
  const { onSubmit, pending, result } = useActionForm(form, updatePasswordAction, {
    onSuccess: () => {
      form.reset();
      if (onDoneHref) window.location.assign(onDoneHref);
    },
  });
  const e = form.formState.errors;
  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <FormStatus result={result} />
      <Field label="Nueva contraseña" htmlFor="password" error={e.password?.message} hint="Mínimo 10 caracteres, con letras y números.">
        <Input id="password" type="password" autoComplete="new-password" aria-invalid={!!e.password} {...form.register("password")} />
      </Field>
      <Field label="Confirmar contraseña" htmlFor="confirm" error={e.confirm?.message}>
        <Input id="confirm" type="password" autoComplete="new-password" aria-invalid={!!e.confirm} {...form.register("confirm")} />
      </Field>
      <Button type="submit" loading={pending}>
        Guardar contraseña
      </Button>
    </form>
  );
}
