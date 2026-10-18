import { z } from "zod";

const trimmed = (max: number) => z.string().trim().max(max, `Máximo ${max} caracteres.`);
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Máximo ${max} caracteres.`)
    .optional()
    .transform((v) => (v ? v : undefined));

const optionalAmount = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? v.replace(/[\s,]/g, "") : undefined))
  .refine((v) => v === undefined || /^\d{1,12}(\.\d{1,2})?$/.test(v), "Monto inválido (use números, máximo 2 decimales).");

const optionalPercent = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? v.replace(",", ".") : undefined))
  .refine((v) => v === undefined || (/^\d{1,3}(\.\d{1,4})?$/.test(v) && Number(v) <= 100), "Porcentaje entre 0 y 100.");

const optionalInt = (min: number, max: number) =>
  z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : undefined))
    .refine((v) => v === undefined || (/^\d+$/.test(v) && Number(v) >= min && Number(v) <= max), `Número entero entre ${min} y ${max}.`);

export const passwordSchema = z
  .string()
  .min(10, "Mínimo 10 caracteres.")
  .max(72, "Máximo 72 caracteres.")
  .regex(/[a-zA-Z]/, "Debe incluir al menos una letra.")
  .regex(/\d/, "Debe incluir al menos un número.");

const commonFields = {
  fullName: trimmed(160).min(2, "Ingresa tu nombre completo."),
  email: z.string().trim().toLowerCase().email("Correo electrónico inválido.").max(254),
  phone: trimmed(40).min(8, "Ingresa un teléfono válido."),
  country: trimmed(60).min(2, "Selecciona un país."),
  personType: z.enum(["individual", "company"], { message: "Selecciona el tipo de persona." }),
  password: passwordSchema,
  acceptTerms: z.literal(true, { message: "Debes aceptar los términos y condiciones." }),
  acceptPrivacy: z.literal(true, { message: "Debes aceptar la política de privacidad." }),
  termsVersionId: z.string().uuid(),
  privacyVersionId: z.string().uuid(),
};

export const borrowerSignUpSchema = z.object({
  role: z.literal("BORROWER"),
  ...commonFields,
  legalName: trimmed(200).min(2, "Ingresa el nombre o razón social."),
  identification: trimmed(40).min(5, "Ingresa la identificación."),
  economicActivity: trimmed(200).min(2, "Describe la actividad económica."),
  province: optionalText(60),
});

export const brokerSignUpSchema = z
  .object({
  role: z.literal("BROKER"),
  ...commonFields,
  fullName: trimmed(160).optional(),
  firstName: trimmed(80).min(2, "Ingresa tu nombre."),
  lastName: trimmed(80).min(2, "Ingresa tus apellidos."),
  companyName: optionalText(160),
  taxId: trimmed(40).min(5, "Ingresa tu cédula física o jurídica."),
  province: trimmed(60).min(2, "Selecciona una provincia."),
  whatsapp: trimmed(40).min(8, "Ingresa un número de WhatsApp."),
  experienceYears: optionalInt(0, 80),
  experienceSummary: optionalText(2000),
  })
  .transform((v) => ({ ...v, fullName: v.fullName || `${v.firstName} ${v.lastName}`.trim() }));

export const investorSignUpSchema = z
  .object({
    role: z.literal("INVESTOR"),
    ...commonFields,
    nationality: trimmed(60).min(2, "Indica tu nacionalidad."),
    residenceCountry: trimmed(60).min(2, "Indica tu país de residencia."),
    availableCapital: optionalAmount,
    minInvestment: optionalAmount,
    maxInvestment: optionalAmount,
    minRatePct: optionalPercent,
    maxTermMonths: optionalInt(1, 600),
    maxLtvPct: optionalPercent,
    preferredProvinces: z.array(z.string()).max(7).default([]),
    guaranteeTypes: z.array(z.string()).max(4).default([]),
    experience: optionalText(1000),
    paymentPreference: optionalText(40),
  })
  .refine((v) => !v.minInvestment || !v.maxInvestment || Number(v.minInvestment) <= Number(v.maxInvestment), {
    message: "La inversión mínima no puede superar la máxima.",
    path: ["maxInvestment"],
  });

export const SIGN_UP_SCHEMAS = {
  BORROWER: borrowerSignUpSchema,
  BROKER: brokerSignUpSchema,
  INVESTOR: investorSignUpSchema,
} as const;

export type BorrowerSignUp = z.input<typeof borrowerSignUpSchema>;
export type BrokerSignUp = z.input<typeof brokerSignUpSchema>;
export type InvestorSignUp = z.input<typeof investorSignUpSchema>;

export const signInSchema = z.object({
  email: z.string().trim().toLowerCase().email("Correo electrónico inválido."),
  password: z.string().min(1, "Ingresa tu contraseña."),
  next: z.string().optional(),
});

export const emailSchema = z.object({
  email: z.string().trim().toLowerCase().email("Correo electrónico inválido."),
});

export const newPasswordSchema = z
  .object({ password: passwordSchema, confirm: z.string() })
  .refine((v) => v.password === v.confirm, { message: "Las contraseñas no coinciden.", path: ["confirm"] });

export const totpCodeSchema = z.object({
  code: z.string().trim().regex(/^\d{6}$/, "El código tiene 6 dígitos."),
});

export const profileUpdateSchema = z.object({
  fullName: trimmed(160).min(2, "Ingresa tu nombre completo."),
  phone: trimmed(40).min(8, "Ingresa un teléfono válido."),
  country: trimmed(60).min(2, "Selecciona un país."),
  personType: z.enum(["individual", "company"]),
});

export const investorPreferencesSchema = z
  .object({
    availableCapital: optionalAmount,
    minInvestment: optionalAmount,
    maxInvestment: optionalAmount,
    minRatePct: optionalPercent,
    maxTermMonths: optionalInt(1, 600),
    maxLtvPct: optionalPercent,
    preferredProvinces: z.array(z.string()).max(7).default([]),
    guaranteeTypes: z.array(z.string()).max(4).default([]),
    paymentPreference: optionalText(40),
    prepaymentConditions: optionalText(500),
    riskTolerance: z.enum(["low", "medium", "high"]).optional().or(z.literal("").transform(() => undefined)),
  })
  .refine((v) => !v.minInvestment || !v.maxInvestment || Number(v.minInvestment) <= Number(v.maxInvestment), {
    message: "La inversión mínima no puede superar la máxima.",
    path: ["maxInvestment"],
  });

/** Solo se permiten redirecciones internas tras el login. */
export function safeNextPath(next: string | null | undefined, fallback = "/app"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("\\")) return fallback;
  return next;
}
