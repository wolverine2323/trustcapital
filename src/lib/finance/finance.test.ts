import { describe, expect, it } from "vitest";
import {
  assertPaymentAllowed,
  commissionBalance,
  commissionFromRate,
  evaluatePolicy,
  FinanceError,
  formatMoney,
  formatPercent,
  ltv,
  monthlyInterest,
  netDisbursement,
  simpleInterestSummary,
  splitCommission,
  totalInterest,
  validateCommissionBases,
} from "./index";

const s = (v: { toFixed: (n: number) => string }) => v.toFixed(2);

describe("LTV", () => {
  it("calcula el ejemplo del documento (250.000 / 600.000 = 41,67 %)", () => {
    expect(s(ltv(250_000, 600_000))).toBe("41.67");
  });

  it("detecta el caso Peñas Blancas por encima del 50 %", () => {
    expect(s(ltv("2000000", "2070456"))).toBe("96.60");
  });

  it("no calcula un LTV definitivo sin valor aceptado", () => {
    expect(() => ltv(250_000, null)).toThrowError(FinanceError);
    expect(() => ltv(250_000, undefined)).toThrow(/valor de garantía aceptado/);
  });

  it("rechaza un valor de garantía cero o negativo", () => {
    expect(() => ltv(100, 0)).toThrow(FinanceError);
    expect(() => ltv(100, -5)).toThrow(FinanceError);
  });
});

describe("Intereses", () => {
  it("reproduce el ejemplo: 250.000 al 12 % por 12 meses", () => {
    const r = simpleInterestSummary(250_000, 12, 12);
    expect(s(r.monthlyInterest)).toBe("2500.00");
    expect(s(r.totalInterest)).toBe("30000.00");
    expect(s(r.principalAtMaturity)).toBe("250000.00");
    expect(s(r.totalRepayment)).toBe("280000.00");
    expect(r.isEstimate).toBe(true);
  });

  it("redondea al centavo sin errores de punto flotante", () => {
    expect(s(monthlyInterest("333333.33", 14))).toBe("3888.89");
    expect(s(totalInterest("0.10", "12", 24))).toBe("0.00");
    expect(s(monthlyInterest("100000", "15"))).toBe("1250.00");
  });

  it("valida tasa y plazo", () => {
    expect(() => monthlyInterest(1000, -1)).toThrow(FinanceError);
    expect(() => totalInterest(1000, 12, 0)).toThrow(FinanceError);
    expect(() => totalInterest(1000, 12, 1.5)).toThrow(FinanceError);
  });
});

describe("Desembolso neto", () => {
  it("resta cada rebajo una sola vez", () => {
    const r = netDisbursement(500_000, [
      { kind: "commercial_commission", amount: 25_000 },
      { kind: "legal_fees", amount: 7_500 },
      { kind: "admin_fees", amount: 2_500 },
      { kind: "first_installment", amount: 5_000 },
      { kind: "debt_payoff", amount: 100_000, reference: "Hipoteca Banco X" },
    ]);
    expect(s(r.totalDeductions)).toBe("140000.00");
    expect(s(r.net)).toBe("360000.00");
  });

  it("rechaza rebajos duplicados", () => {
    expect(() =>
      netDisbursement(100_000, [
        { kind: "legal_fees", amount: 1_000 },
        { kind: "legal_fees", amount: 1_000 },
      ]),
    ).toThrow(/duplicado/);
    expect(() =>
      netDisbursement(100_000, [
        { kind: "debt_payoff", amount: 1_000, reference: "Hipoteca A" },
        { kind: "debt_payoff", amount: 1_000, reference: "hipoteca a " },
      ]),
    ).toThrow(/duplicado/);
  });

  it("permite varias cancelaciones de deuda distintas", () => {
    const r = netDisbursement(100_000, [
      { kind: "debt_payoff", amount: 10_000, reference: "Hipoteca A" },
      { kind: "debt_payoff", amount: 5_000, reference: "Gravamen B" },
    ]);
    expect(s(r.net)).toBe("85000.00");
  });

  it("no permite un neto negativo", () => {
    expect(() => netDisbursement(1_000, [{ kind: "admin_fees", amount: 1_500 }])).toThrow(/superan/);
  });
});

describe("Comisiones 50/50", () => {
  it("ejemplo 9.2: crédito 500.000, comercial 5 %, recibida 2,5 %", () => {
    const commercial = commissionFromRate(500_000, 5);
    const received = commissionFromRate(500_000, "2.5");
    expect(s(commercial)).toBe("25000.00");
    expect(s(received)).toBe("12500.00");
    validateCommissionBases({ commercialAmount: commercial, receivedAmount: received, distributableAmount: received });
    const split = splitCommission(received);
    expect(s(split.trustCapital)).toBe("6250.00");
    expect(s(split.broker)).toBe("6250.00");
  });

  it("ejemplo 9.9: crédito 1.000.000 al 2,5 % → 12.500 / 12.500", () => {
    const split = splitCommission(commissionFromRate(1_000_000, "2.5"));
    expect(s(split.trustCapital)).toBe("12500.00");
    expect(s(split.broker)).toBe("12500.00");
  });

  it("la suma de las partes siempre es igual a la base, incluso con centavos impares", () => {
    for (const base of ["0.01", "0.03", "12345.67", "999999.99", "1.11"]) {
      const split = splitCommission(base);
      expect(split.broker.plus(split.trustCapital).toFixed(2)).toBe(Number(base).toFixed(2));
    }
  });

  it("soporta excepciones autorizadas con otro porcentaje", () => {
    const split = splitCommission(10_000, 40);
    expect(s(split.broker)).toBe("4000.00");
    expect(s(split.trustCapital)).toBe("6000.00");
    expect(() => splitCommission(10_000, 101)).toThrow(FinanceError);
  });

  it("la comisión elegible no puede superar la recibida", () => {
    expect(() => validateCommissionBases({ receivedAmount: 12_500, distributableAmount: 12_500.01 })).toThrow(/elegible/);
    expect(() => validateCommissionBases({ commercialAmount: 10_000, receivedAmount: 12_500, distributableAmount: 1 })).toThrow(/comercial/);
  });
});

describe("Pagos de comisión", () => {
  it("calcula saldo pendiente con pagos parciales", () => {
    expect(s(commissionBalance(6_250, [2_000, "1250.50"]))).toBe("2999.50");
  });

  it("nunca permite pagar más del saldo aprobado", () => {
    expect(() => assertPaymentAllowed(6_250, [6_000], 250.01)).toThrow(/supera/);
    expect(() => assertPaymentAllowed(6_250, [6_000], 250)).not.toThrow();
    expect(() => assertPaymentAllowed(6_250, [], 0)).toThrow(FinanceError);
  });
});

describe("Alertas de política", () => {
  it("Peñas Blancas: LTV sobre el objetivo", () => {
    const r = evaluatePolicy({ amount: 2_000_000, termMonths: 24, acceptedCollateralValue: 2_070_456 });
    expect(r.alerts.map((a) => a.code)).toContain("ltv_above_target");
  });

  it("Hotel Manuel Antonio: monto sobre el rango habitual y LTV pendiente", () => {
    const r = evaluatePolicy({ amount: 4_500_000, termMonths: 24, acceptedCollateralValue: null });
    const codes = r.alerts.map((a) => a.code);
    expect(codes).toContain("amount_above_range");
    expect(codes).toContain("ltv_pending_value");
    expect(r.ltvPct).toBeNull();
  });

  it("Lagunas de Barú: dentro de política", () => {
    const r = evaluatePolicy({ amount: 250_000, termMonths: 12, acceptedCollateralValue: 600_000 });
    expect(r.alerts).toHaveLength(0);
    expect(r.ltvPct?.toFixed(2)).toBe("41.67");
  });
});

describe("Formato", () => {
  it("usa el formato de los documentos de Trust Capital", () => {
    expect(formatMoney(500_000, "USD", 0)).toBe("US$500.000");
    expect(formatMoney("3728456.58")).toBe("US$3.728.456,58");
    expect(formatMoney(null)).toBe("—");
    expect(formatPercent("41.6667")).toBe("41,67 %");
  });
});
