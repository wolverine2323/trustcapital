import { assertNonNegative, d, Decimal, FinanceError, round2, type MoneyInput } from "./money";

/* ------------------------------------------------------------------ */
/* LTV                                                                 */
/* ------------------------------------------------------------------ */

/**
 * LTV = monto del crédito / valor aceptado de la garantía × 100.
 * Sin valor aceptado no existe LTV definitivo: se lanza un error explícito.
 */
export function ltv(loanAmount: MoneyInput, acceptedCollateralValue: MoneyInput | null | undefined): Decimal {
  if (acceptedCollateralValue === null || acceptedCollateralValue === undefined || acceptedCollateralValue === "") {
    throw new FinanceError("ltv_without_accepted_value", "No se puede calcular un LTV definitivo sin un valor de garantía aceptado.");
  }
  const loan = d(loanAmount);
  const value = d(acceptedCollateralValue);
  assertNonNegative(loan, "El monto del crédito");
  if (value.lte(0)) {
    throw new FinanceError("invalid_collateral_value", "El valor aceptado de la garantía debe ser mayor que cero.");
  }
  return loan.div(value).times(100).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
}

/* ------------------------------------------------------------------ */
/* Intereses (interés simple, pagos mensuales, capital al vencimiento) */
/* ------------------------------------------------------------------ */

function assertRate(annualRatePct: Decimal) {
  if (annualRatePct.isNegative() || annualRatePct.gt(100)) {
    throw new FinanceError("invalid_rate", "La tasa anual debe estar entre 0 % y 100 %.");
  }
}

function assertTerm(months: number) {
  if (!Number.isInteger(months) || months <= 0 || months > 600) {
    throw new FinanceError("invalid_term", "El plazo debe ser un número entero de meses mayor que cero.");
  }
}

/** Interés mensual = capital × tasa anual / 12. */
export function monthlyInterest(principal: MoneyInput, annualRatePct: MoneyInput): Decimal {
  const p = d(principal);
  const r = d(annualRatePct);
  assertNonNegative(p, "El capital");
  assertRate(r);
  return round2(p.times(r).div(100).div(12));
}

/** Interés total = interés mensual × plazo en meses. */
export function totalInterest(principal: MoneyInput, annualRatePct: MoneyInput, termMonths: number): Decimal {
  assertTerm(termMonths);
  return round2(monthlyInterest(principal, annualRatePct).times(termMonths));
}

export interface InterestSummary {
  monthlyInterest: Decimal;
  totalInterest: Decimal;
  principalAtMaturity: Decimal;
  totalRepayment: Decimal;
  /** Siempre true: los cálculos previos a la formalización son estimaciones. */
  isEstimate: true;
}

export function simpleInterestSummary(principal: MoneyInput, annualRatePct: MoneyInput, termMonths: number): InterestSummary {
  const p = round2(principal);
  const monthly = monthlyInterest(p, annualRatePct);
  const total = totalInterest(p, annualRatePct, termMonths);
  return {
    monthlyInterest: monthly,
    totalInterest: total,
    principalAtMaturity: p,
    totalRepayment: round2(p.plus(total)),
    isEstimate: true,
  };
}

/* ------------------------------------------------------------------ */
/* Desembolso neto                                                     */
/* ------------------------------------------------------------------ */

export const DEDUCTION_KINDS = [
  "commercial_commission",
  "legal_fees",
  "admin_fees",
  "first_installment",
  "debt_payoff",
  "other",
] as const;
export type DeductionKind = (typeof DEDUCTION_KINDS)[number];

export const DEDUCTION_LABELS: Record<DeductionKind, string> = {
  commercial_commission: "Comisión comercial",
  legal_fees: "Gastos legales",
  admin_fees: "Gastos administrativos",
  first_installment: "Primera cuota adelantada",
  debt_payoff: "Cancelación de deudas",
  other: "Otros rebajos",
};

export interface Deduction {
  kind: DeductionKind;
  amount: MoneyInput;
  /** Obligatorio para "debt_payoff" y "other": identifica el rebajo y evita duplicados. */
  reference?: string;
}

export interface NetDisbursement {
  gross: Decimal;
  lines: { kind: DeductionKind; reference?: string; label: string; amount: Decimal }[];
  totalDeductions: Decimal;
  net: Decimal;
}

/**
 * Calcula el neto a desembolsar. Rechaza rebajos duplicados:
 * cada concepto único (comisión, gastos legales, gastos administrativos, primera cuota)
 * solo puede aparecer una vez; cancelaciones de deuda y otros rebajos se distinguen por referencia.
 */
export function netDisbursement(grossAmount: MoneyInput, deductions: Deduction[]): NetDisbursement {
  const gross = round2(grossAmount);
  if (gross.lte(0)) throw new FinanceError("invalid_gross", "El crédito bruto debe ser mayor que cero.");

  const seen = new Set<string>();
  const lines = deductions.map((item) => {
    const amount = round2(item.amount);
    assertNonNegative(amount, DEDUCTION_LABELS[item.kind]);
    const multi = item.kind === "debt_payoff" || item.kind === "other";
    if (multi && !item.reference?.trim()) {
      throw new FinanceError("missing_reference", `${DEDUCTION_LABELS[item.kind]} requiere una referencia.`);
    }
    const key = multi ? `${item.kind}:${item.reference!.trim().toLowerCase()}` : item.kind;
    if (seen.has(key)) {
      throw new FinanceError("duplicate_deduction", `Rebajo duplicado: ${DEDUCTION_LABELS[item.kind]}${multi ? ` (${item.reference})` : ""}.`);
    }
    seen.add(key);
    return { kind: item.kind, reference: item.reference, label: DEDUCTION_LABELS[item.kind], amount };
  });

  const totalDeductions = round2(lines.reduce((acc, l) => acc.plus(l.amount), new Decimal(0)));
  const net = round2(gross.minus(totalDeductions));
  if (net.isNegative()) {
    throw new FinanceError("negative_net", "Los rebajos superan el monto bruto del crédito.");
  }
  return { gross, lines, totalDeductions, net };
}

/* ------------------------------------------------------------------ */
/* Comisiones: dos beneficiarios (Trust Capital y broker originador)  */
/* ------------------------------------------------------------------ */

export const DEFAULT_BROKER_SHARE_PCT = 50;

/** Monto de una comisión expresada como % del crédito. */
export function commissionFromRate(loanAmount: MoneyInput, ratePct: MoneyInput): Decimal {
  const loan = d(loanAmount);
  const rate = d(ratePct);
  assertNonNegative(loan, "El monto del crédito");
  assertRate(rate);
  return round2(loan.times(rate).div(100));
}

export interface CommissionSplit {
  distributable: Decimal;
  brokerSharePct: Decimal;
  trustCapitalSharePct: Decimal;
  broker: Decimal;
  trustCapital: Decimal;
}

/**
 * Reparte la comisión elegible recibida por Trust Capital.
 * broker = round(base × % broker); Trust Capital = base − broker → la suma siempre cuadra al centavo.
 * La misma fórmula se aplica en la base de datos (trigger), que es la fuente de verdad.
 */
export function splitCommission(distributable: MoneyInput, brokerSharePct: MoneyInput = DEFAULT_BROKER_SHARE_PCT): CommissionSplit {
  const base = round2(distributable);
  const pct = d(brokerSharePct);
  assertNonNegative(base, "La comisión elegible");
  if (pct.isNegative() || pct.gt(100)) {
    throw new FinanceError("invalid_share", "El porcentaje del broker debe estar entre 0 % y 100 %.");
  }
  const broker = round2(base.times(pct).div(100));
  return {
    distributable: base,
    brokerSharePct: pct,
    trustCapitalSharePct: new Decimal(100).minus(pct),
    broker,
    trustCapital: round2(base.minus(broker)),
  };
}

/**
 * Valida la jerarquía de comisiones de una operación:
 * comercial total ≥ recibida por Trust Capital ≥ elegible para reparto.
 */
export function validateCommissionBases(input: {
  commercialAmount?: MoneyInput | null;
  receivedAmount: MoneyInput;
  distributableAmount: MoneyInput;
}) {
  const received = round2(input.receivedAmount);
  const distributable = round2(input.distributableAmount);
  assertNonNegative(received, "La comisión recibida");
  assertNonNegative(distributable, "La comisión elegible");
  if (distributable.gt(received)) {
    throw new FinanceError("distributable_exceeds_received", "La comisión elegible no puede superar la comisión recibida por Trust Capital.");
  }
  if (input.commercialAmount !== null && input.commercialAmount !== undefined && input.commercialAmount !== "") {
    const commercial = round2(input.commercialAmount);
    if (received.gt(commercial)) {
      throw new FinanceError("received_exceeds_commercial", "La comisión recibida no puede superar la comisión comercial total.");
    }
  }
}

/** Saldo pendiente del broker y validación de nuevo pago (nunca pagar más del saldo aprobado). */
export function commissionBalance(approvedAmount: MoneyInput, confirmedPayments: MoneyInput[]): Decimal {
  const approved = round2(approvedAmount);
  const paid = round2(confirmedPayments.reduce<Decimal>((acc, p) => acc.plus(d(p)), new Decimal(0)));
  return round2(approved.minus(paid));
}

export function assertPaymentAllowed(approvedAmount: MoneyInput, confirmedPayments: MoneyInput[], newPayment: MoneyInput) {
  const amount = round2(newPayment);
  if (amount.lte(0)) throw new FinanceError("invalid_payment", "El pago debe ser mayor que cero.");
  const balance = commissionBalance(approvedAmount, confirmedPayments);
  if (amount.gt(balance)) {
    throw new FinanceError("overpayment", "El pago supera el saldo aprobado pendiente.");
  }
}
