"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/form-controls";
import { CheckboxGroup } from "@/components/forms/checkbox-group";
import { FormStatus } from "@/components/forms/form-status";
import { useActionForm } from "@/components/forms/use-action-form";
import { CR_PROVINCES, GUARANTEE_TYPES, PAYMENT_PREFERENCES, RISK_TOLERANCE } from "@/lib/domain/catalogs";
import { investorPreferencesSchema } from "@/lib/validation/auth";
import { updateInvestorPreferencesAction } from "@/server/actions/account";

type Values = z.input<typeof investorPreferencesSchema>;

export function PreferencesForm({ defaults }: { defaults: Values }) {
  const form = useForm<Values, unknown, z.output<typeof investorPreferencesSchema>>({
    resolver: zodResolver(investorPreferencesSchema),
    defaultValues: defaults,
  });
  const { onSubmit, pending, result } = useActionForm(form, updateInvestorPreferencesAction);
  const e = form.formState.errors;
  const reg = (name: keyof Values) => ({ id: name, "aria-invalid": !!e[name], ...form.register(name) });

  return (
    <form onSubmit={onSubmit} noValidate>
      <Card>
        <CardHeader>
          <CardTitle>Capital y condiciones</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <FormStatus result={result} />
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Capital disponible (US$)" htmlFor="availableCapital" error={e.availableCapital?.message}>
              <Input inputMode="decimal" className="tabular" {...reg("availableCapital")} />
            </Field>
            <Field label="Monto mínimo (US$)" htmlFor="minInvestment" error={e.minInvestment?.message}>
              <Input inputMode="decimal" className="tabular" {...reg("minInvestment")} />
            </Field>
            <Field label="Monto máximo (US$)" htmlFor="maxInvestment" error={e.maxInvestment?.message}>
              <Input inputMode="decimal" className="tabular" {...reg("maxInvestment")} />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Tasa mínima (%)" htmlFor="minRatePct" error={e.minRatePct?.message}>
              <Input inputMode="decimal" className="tabular" {...reg("minRatePct")} />
            </Field>
            <Field label="Plazo máximo (meses)" htmlFor="maxTermMonths" error={e.maxTermMonths?.message}>
              <Input inputMode="numeric" className="tabular" {...reg("maxTermMonths")} />
            </Field>
            <Field label="LTV máximo (%)" htmlFor="maxLtvPct" error={e.maxLtvPct?.message}>
              <Input inputMode="decimal" className="tabular" {...reg("maxLtvPct")} />
            </Field>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Provincias</span>
            <CheckboxGroup control={form.control} name="preferredProvinces" options={CR_PROVINCES.map((p) => ({ value: p, label: p }))} columns={3} />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Tipos de garantía</span>
            <CheckboxGroup control={form.control} name="guaranteeTypes" options={GUARANTEE_TYPES} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Forma de pago" htmlFor="paymentPreference" error={e.paymentPreference?.message}>
              <Select {...reg("paymentPreference")}>
                <option value="">Seleccionar…</option>
                {PAYMENT_PREFERENCES.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </Select>
            </Field>
            <Field label="Tolerancia al riesgo" htmlFor="riskTolerance" error={e.riskTolerance?.message}>
              <Select {...reg("riskTolerance")}>
                <option value="">Seleccionar…</option>
                {RISK_TOLERANCE.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Condiciones de prepago" htmlFor="prepaymentConditions" error={e.prepaymentConditions?.message}>
            <Textarea rows={2} placeholder="Opcional" {...reg("prepaymentConditions")} />
          </Field>
          <p className="text-[13px] text-muted-foreground">
            Estas preferencias se usan para mostrarte oportunidades compatibles. La compatibilidad no constituye asesoría financiera ni una
            garantía de idoneidad.
          </p>
        </CardContent>
        <CardFooter className="justify-end">
          <Button type="submit" loading={pending}>Guardar preferencias</Button>
        </CardFooter>
      </Card>
    </form>
  );
}
