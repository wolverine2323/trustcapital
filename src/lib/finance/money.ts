import DecimalBase from "decimal.js";

/**
 * Decimal configurado para importes monetarios.
 * Nunca usar `number` para operar con dinero: solo para mostrarlo.
 */
export const Decimal = DecimalBase.clone({ precision: 40, rounding: DecimalBase.ROUND_HALF_UP });
export type Decimal = InstanceType<typeof Decimal>;

export type MoneyInput = Decimal | string | number;

export const CURRENCIES = ["USD", "CRC"] as const;
export type Currency = (typeof CURRENCIES)[number];

export class FinanceError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "FinanceError";
  }
}

export function d(value: MoneyInput): Decimal {
  if (value instanceof Decimal) return value;
  if (typeof value === "number" && !Number.isFinite(value)) {
    throw new FinanceError("invalid_number", "El valor no es un número válido.");
  }
  try {
    return new Decimal(typeof value === "string" ? value.trim() : value);
  } catch {
    throw new FinanceError("invalid_number", `Valor numérico inválido: ${String(value)}`);
  }
}

/** Redondea a centavos (2 decimales, mitad hacia arriba). */
export function round2(value: MoneyInput): Decimal {
  return d(value).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
}

export function assertNonNegative(value: Decimal, field: string) {
  if (value.isNegative()) {
    throw new FinanceError("negative_amount", `${field} no puede ser negativo.`);
  }
}

/** Convierte a string con 2 decimales, apto para enviar a PostgreSQL numeric. */
export function toDbAmount(value: MoneyInput): string {
  return round2(value).toFixed(2);
}

/** Formato de la plataforma: "US$1.234.567,50" (punto de miles, coma decimal, como en el mercado costarricense). */
const numberFmt = (digits: number) =>
  new Intl.NumberFormat("de-DE", { minimumFractionDigits: digits, maximumFractionDigits: digits, useGrouping: true });

const CURRENCY_PREFIX: Record<Currency, string> = { USD: "US$", CRC: "₡" };

export function formatMoney(value: MoneyInput | null | undefined, currency: Currency = "USD", digits = 2): string {
  if (value === null || value === undefined || value === "") return "—";
  const n = round2(value);
  const sign = n.isNegative() ? "-" : "";
  return `${sign}${CURRENCY_PREFIX[currency]}${numberFmt(digits).format(n.abs().toNumber())}`;
}

export function formatPercent(value: MoneyInput | null | undefined, digits = 2): string {
  if (value === null || value === undefined || value === "") return "—";
  return `${numberFmt(digits).format(d(value).toDecimalPlaces(digits).toNumber())} %`;
}
