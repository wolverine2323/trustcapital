"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm, type FieldValues } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/form-controls";
import { CheckboxGroup } from "@/components/forms/checkbox-group";
import { FormStatus } from "@/components/forms/form-status";
import { useActionForm } from "@/components/forms/use-action-form";
import { COUNTRIES, CR_PROVINCES, GUARANTEE_TYPES, PAYMENT_PREFERENCES, PERSON_TYPES } from "@/lib/domain/catalogs";
import type { SelfServiceRole } from "@/lib/domain/roles";
import { SIGN_UP_SCHEMAS } from "@/lib/validation/auth";
import { signUpAction } from "@/server/actions/auth";

type Values = FieldValues;

const provinceOptions = CR_PROVINCES.map((p) => ({ value: p, label: p }));

function Fieldset({ legend, children }: { legend: string; children: React.ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-4 rounded-xl border border-border p-4 sm:p-5">
      <legend className="px-1 text-sm font-semibold text-primary">{legend}</legend>
      {children}
    </fieldset>
  );
}

export function RegistrationForm(props: {
  role: SelfServiceRole;
  termsVersionId: string;
  termsVersion: string;
  privacyVersionId: string;
  privacyVersion: string;
}) {
  const { role } = props;
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);

  const form = useForm<Values>({
    resolver: zodResolver(SIGN_UP_SCHEMAS[role] as never),
    defaultValues: {
      role,
      fullName: "",
      email: "",
      phone: "",
      country: "Costa Rica",
      personType: "individual",
      password: "",
      acceptTerms: false,
      acceptPrivacy: false,
      termsVersionId: props.termsVersionId,
      privacyVersionId: props.privacyVersionId,
      preferredProvinces: [],
      guaranteeTypes: [],
    },
  });

  const { onSubmit, pending, result } = useActionForm(form, signUpAction, {
    onSuccess: () => setSubmittedEmail(form.getValues("email") as string),
  });

  const err = (name: string) => form.formState.errors[name]?.message as string | undefined;
  const reg = (name: string) => ({ id: name, "aria-invalid": !!err(name), ...form.register(name) });
  const personType = form.watch("personType");

  if (submittedEmail) {
    return (
      <div className="flex flex-col items-start gap-4 rounded-xl border border-border bg-card p-6">
        <span className="inline-flex size-11 items-center justify-center rounded-lg bg-success-soft text-success">
          <MailCheck className="size-5" />
        </span>
        <div>
          <h2 className="text-lg font-semibold text-primary">Confirma tu correo</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Enviamos un enlace de confirmación a <span className="font-medium text-foreground">{submittedEmail}</span>. Ábrelo para activar tu
            cuenta. Si no lo ves, revisa la carpeta de correo no deseado.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/login">Ir a ingresar</Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      <FormStatus result={result} hideSuccess />

      <Fieldset legend="Datos de la cuenta">
        {role === "BROKER" ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nombre" htmlFor="firstName" error={err("firstName")} required>
              <Input autoComplete="given-name" {...reg("firstName")} />
            </Field>
            <Field label="Apellidos" htmlFor="lastName" error={err("lastName")} required>
              <Input autoComplete="family-name" {...reg("lastName")} />
            </Field>
          </div>
        ) : (
          <Field label="Nombre completo" htmlFor="fullName" error={err("fullName")} required>
            <Input autoComplete="name" {...reg("fullName")} />
          </Field>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Correo electrónico" htmlFor="email" error={err("email")} required>
            <Input type="email" autoComplete="email" inputMode="email" {...reg("email")} />
          </Field>
          <Field label="Teléfono" htmlFor="phone" error={err("phone")} required>
            <Input type="tel" autoComplete="tel" inputMode="tel" placeholder="+506 8888 8888" {...reg("phone")} />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="País" htmlFor="country" error={err("country")} required>
            <Select {...reg("country")}>
              {COUNTRIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </Select>
          </Field>
          <Field label="Tipo de persona" htmlFor="personType" error={err("personType")} required>
            <Select {...reg("personType")}>
              {PERSON_TYPES.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </Select>
          </Field>
        </div>
        <Field label="Contraseña" htmlFor="password" error={err("password")} hint="Mínimo 10 caracteres, con letras y números." required>
          <Input type="password" autoComplete="new-password" {...reg("password")} />
        </Field>
      </Fieldset>

      {role === "BORROWER" && (
        <Fieldset legend="Datos del solicitante">
          <Field label={personType === "company" ? "Razón social" : "Nombre del solicitante"} htmlFor="legalName" error={err("legalName")} required>
            <Input {...reg("legalName")} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={personType === "company" ? "Cédula jurídica" : "Identificación"} htmlFor="identification" error={err("identification")} required>
              <Input {...reg("identification")} />
            </Field>
            <Field label="Provincia" htmlFor="province" error={err("province")}>
              <Select {...reg("province")}>
                <option value="">Seleccionar…</option>
                {CR_PROVINCES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Actividad económica" htmlFor="economicActivity" error={err("economicActivity")} required>
            <Input placeholder="Ej.: desarrollo inmobiliario, turismo, transporte" {...reg("economicActivity")} />
          </Field>
        </Fieldset>
      )}

      {role === "BROKER" && (
        <Fieldset legend="Perfil profesional">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Empresa" htmlFor="companyName" error={err("companyName")}>
              <Input autoComplete="organization" {...reg("companyName")} />
            </Field>
            <Field label="Cédula física o jurídica" htmlFor="taxId" error={err("taxId")} required>
              <Input {...reg("taxId")} />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Provincia" htmlFor="province" error={err("province")} required>
              <Select {...reg("province")}>
                <option value="">Seleccionar…</option>
                {CR_PROVINCES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </Select>
            </Field>
            <Field label="WhatsApp" htmlFor="whatsapp" error={err("whatsapp")} required>
              <Input type="tel" inputMode="tel" {...reg("whatsapp")} />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-[140px_1fr]">
            <Field label="Años de experiencia" htmlFor="experienceYears" error={err("experienceYears")}>
              <Input inputMode="numeric" {...reg("experienceYears")} />
            </Field>
            <Field label="Experiencia" htmlFor="experienceSummary" error={err("experienceSummary")}>
              <Textarea rows={2} placeholder="Tipo de operaciones y clientes con los que trabajas" {...reg("experienceSummary")} />
            </Field>
          </div>
          <p className="text-[13px] text-muted-foreground">
            Los datos para el pago de comisiones, tu identificación y la aceptación del acuerdo de intermediación se completan desde tu panel
            antes de presentar el primer caso.
          </p>
        </Fieldset>
      )}

      {role === "INVESTOR" && (
        <Fieldset legend="Perfil de inversión">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nacionalidad" htmlFor="nationality" error={err("nationality")} required>
              <Input {...reg("nationality")} />
            </Field>
            <Field label="País de residencia" htmlFor="residenceCountry" error={err("residenceCountry")} required>
              <Input {...reg("residenceCountry")} />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Capital disponible (US$)" htmlFor="availableCapital" error={err("availableCapital")}>
              <Input inputMode="decimal" className="tabular" {...reg("availableCapital")} />
            </Field>
            <Field label="Inversión mínima (US$)" htmlFor="minInvestment" error={err("minInvestment")}>
              <Input inputMode="decimal" className="tabular" {...reg("minInvestment")} />
            </Field>
            <Field label="Inversión máxima (US$)" htmlFor="maxInvestment" error={err("maxInvestment")}>
              <Input inputMode="decimal" className="tabular" {...reg("maxInvestment")} />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Tasa mínima esperada (%)" htmlFor="minRatePct" error={err("minRatePct")}>
              <Input inputMode="decimal" className="tabular" {...reg("minRatePct")} />
            </Field>
            <Field label="Plazo máximo (meses)" htmlFor="maxTermMonths" error={err("maxTermMonths")}>
              <Input inputMode="numeric" className="tabular" {...reg("maxTermMonths")} />
            </Field>
            <Field label="LTV máximo (%)" htmlFor="maxLtvPct" error={err("maxLtvPct")}>
              <Input inputMode="decimal" className="tabular" {...reg("maxLtvPct")} />
            </Field>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Ubicación preferida</span>
            <CheckboxGroup control={form.control} name="preferredProvinces" options={provinceOptions} columns={3} />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Tipo de garantía</span>
            <CheckboxGroup control={form.control} name="guaranteeTypes" options={GUARANTEE_TYPES} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Preferencia de pago" htmlFor="paymentPreference" error={err("paymentPreference")}>
              <Select {...reg("paymentPreference")}>
                <option value="">Seleccionar…</option>
                {PAYMENT_PREFERENCES.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </Select>
            </Field>
            <Field label="Experiencia como inversionista" htmlFor="experience" error={err("experience")}>
              <Input placeholder="Opcional" {...reg("experience")} />
            </Field>
          </div>
        </Fieldset>
      )}

      <div className="flex flex-col gap-3">
        <label className="flex items-start gap-2.5 text-sm">
          <Checkbox {...form.register("acceptTerms")} aria-invalid={!!err("acceptTerms")} />
          <span>
            Acepto los{" "}
            <Link href="/terminos" target="_blank" className="font-medium text-accent-strong underline-offset-2 hover:underline">
              términos y condiciones
            </Link>{" "}
            <span className="text-muted-foreground">(versión {props.termsVersion})</span>.
          </span>
        </label>
        {err("acceptTerms") && <p className="-mt-1 pl-6 text-[13px] text-danger">{err("acceptTerms")}</p>}
        <label className="flex items-start gap-2.5 text-sm">
          <Checkbox {...form.register("acceptPrivacy")} aria-invalid={!!err("acceptPrivacy")} />
          <span>
            Acepto la{" "}
            <Link href="/privacidad" target="_blank" className="font-medium text-accent-strong underline-offset-2 hover:underline">
              política de privacidad
            </Link>{" "}
            <span className="text-muted-foreground">(versión {props.privacyVersion})</span>.
          </span>
        </label>
        {err("acceptPrivacy") && <p className="-mt-1 pl-6 text-[13px] text-danger">{err("acceptPrivacy")}</p>}
      </div>

      <Button type="submit" size="lg" loading={pending}>
        Crear cuenta
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="font-medium text-accent-strong hover:underline">
          Ingresar
        </Link>
      </p>
    </form>
  );

}
