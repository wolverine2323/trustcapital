export const CR_PROVINCES = ["San José", "Alajuela", "Cartago", "Heredia", "Guanacaste", "Puntarenas", "Limón"] as const;

export const COUNTRIES = [
  "Costa Rica",
  "Panamá",
  "Nicaragua",
  "El Salvador",
  "Guatemala",
  "Honduras",
  "México",
  "Colombia",
  "Estados Unidos",
  "Canadá",
  "España",
  "Otro",
] as const;

export const GUARANTEE_TYPES = [
  { value: "first_mortgage", label: "Hipoteca en primer grado" },
  { value: "second_mortgage", label: "Hipoteca en segundo grado" },
  { value: "trust", label: "Fideicomiso de garantía" },
  { value: "other", label: "Otra garantía aceptada" },
] as const;

export const PAYMENT_PREFERENCES = [
  { value: "monthly_interest", label: "Intereses mensuales" },
  { value: "quarterly_interest", label: "Intereses trimestrales" },
  { value: "at_maturity", label: "Al vencimiento" },
] as const;

export const RISK_TOLERANCE = [
  { value: "low", label: "Conservadora" },
  { value: "medium", label: "Moderada" },
  { value: "high", label: "Dinámica" },
] as const;

export const PERSON_TYPES = [
  { value: "individual", label: "Persona física" },
  { value: "company", label: "Persona jurídica" },
] as const;
