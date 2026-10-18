import { d, Decimal, type MoneyInput } from "./money";
import { ltv } from "./calculations";

/** Políticas comerciales de referencia (configurables en system_settings). */
export interface CommercialPolicy {
  minAmount: MoneyInput;
  maxAmount: MoneyInput;
  minTermMonths: number;
  maxTermMonths: number;
  referenceRatePct: MoneyInput;
  targetMaxLtvPct: MoneyInput;
}

export const DEFAULT_POLICY: CommercialPolicy = {
  minAmount: 50_000,
  maxAmount: 3_500_000,
  minTermMonths: 12,
  maxTermMonths: 24,
  referenceRatePct: 12,
  targetMaxLtvPct: 50,
};

export type PolicyAlertCode =
  | "ltv_above_target"
  | "ltv_pending_value"
  | "amount_below_range"
  | "amount_above_range"
  | "term_below_range"
  | "term_above_range";

export interface PolicyAlert {
  code: PolicyAlertCode;
  severity: "warning" | "info";
  message: string;
}

export function evaluatePolicy(
  input: { amount: MoneyInput; termMonths?: number | null; acceptedCollateralValue?: MoneyInput | null },
  policy: CommercialPolicy = DEFAULT_POLICY,
): { alerts: PolicyAlert[]; ltvPct: Decimal | null } {
  const alerts: PolicyAlert[] = [];
  const amount = d(input.amount);
  let ltvPct: Decimal | null = null;

  if (input.acceptedCollateralValue === null || input.acceptedCollateralValue === undefined || input.acceptedCollateralValue === "") {
    alerts.push({ code: "ltv_pending_value", severity: "info", message: "LTV pendiente: no hay un valor de garantía aceptado." });
  } else {
    ltvPct = ltv(amount, input.acceptedCollateralValue);
    if (ltvPct.gt(d(policy.targetMaxLtvPct))) {
      alerts.push({
        code: "ltv_above_target",
        severity: "warning",
        message: `LTV de ${ltvPct.toFixed(2)} % supera el objetivo máximo de ${d(policy.targetMaxLtvPct).toFixed(0)} %.`,
      });
    }
  }

  if (amount.lt(d(policy.minAmount))) {
    alerts.push({ code: "amount_below_range", severity: "warning", message: "El monto está por debajo del rango habitual." });
  } else if (amount.gt(d(policy.maxAmount))) {
    alerts.push({ code: "amount_above_range", severity: "warning", message: "El monto supera el rango habitual." });
  }

  if (input.termMonths) {
    if (input.termMonths < policy.minTermMonths) {
      alerts.push({ code: "term_below_range", severity: "info", message: `Plazo menor al habitual (${policy.minTermMonths} meses).` });
    } else if (input.termMonths > policy.maxTermMonths) {
      alerts.push({ code: "term_above_range", severity: "warning", message: `Plazo mayor al habitual (${policy.maxTermMonths} meses).` });
    }
  }

  return { alerts, ltvPct };
}
