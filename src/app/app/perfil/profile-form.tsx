"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/form-controls";
import { FormStatus } from "@/components/forms/form-status";
import { useActionForm } from "@/components/forms/use-action-form";
import { COUNTRIES, PERSON_TYPES } from "@/lib/domain/catalogs";
import { profileUpdateSchema } from "@/lib/validation/auth";
import { updateProfileAction } from "@/server/actions/account";

type Values = z.input<typeof profileUpdateSchema>;

export function ProfileForm({ defaults, email }: { defaults: Values; email: string }) {
  const form = useForm<Values>({ resolver: zodResolver(profileUpdateSchema), defaultValues: defaults });
  const { onSubmit, pending, result } = useActionForm(form, updateProfileAction);
  const e = form.formState.errors;
  const countries = COUNTRIES.includes(defaults.country as (typeof COUNTRIES)[number]) ? COUNTRIES : [defaults.country, ...COUNTRIES];

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <FormStatus result={result} />
      <Field label="Nombre completo" htmlFor="fullName" error={e.fullName?.message} required>
        <Input id="fullName" autoComplete="name" aria-invalid={!!e.fullName} {...form.register("fullName")} />
      </Field>
      <Field label="Correo electrónico" htmlFor="email" hint="Para cambiar tu correo, contacta a Trust Capital.">
        <Input id="email" value={email} disabled readOnly />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Teléfono" htmlFor="phone" error={e.phone?.message} required>
          <Input id="phone" type="tel" autoComplete="tel" aria-invalid={!!e.phone} {...form.register("phone")} />
        </Field>
        <Field label="País" htmlFor="country" error={e.country?.message} required>
          <Select id="country" {...form.register("country")}>
            {countries.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </Select>
        </Field>
      </div>
      <Field label="Tipo de persona" htmlFor="personType" error={e.personType?.message}>
        <Select id="personType" {...form.register("personType")}>
          {PERSON_TYPES.map((p) => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </Select>
      </Field>
      <div className="flex justify-end">
        <Button type="submit" loading={pending} disabled={!form.formState.isDirty}>Guardar cambios</Button>
      </div>
    </form>
  );
}
