import type { Metadata } from "next";
import { Alert } from "@/components/ui/alert";
import { PageHeader } from "@/components/shared/page-header";
import { getInvestorPreferences } from "@/server/investor";
import { requireRole } from "@/server/session";
import { PreferencesForm } from "./preferences-form";

export const metadata: Metadata = { title: "Preferencias de inversión" };

const str = (v: string | number | null | undefined) => (v === null || v === undefined ? "" : String(Number(v)));

export default async function InvestorPreferencesPage() {
  const session = await requireRole("INVESTOR");
  const prefs = await getInvestorPreferences(session.userId);
  return (
    <>
      <PageHeader title="Preferencias de inversión" description="Define qué tipo de oportunidades te interesan." />
      {prefs ? (
        <div className="max-w-3xl">
          <PreferencesForm
            defaults={{
              availableCapital: str(prefs.available_capital),
              minInvestment: str(prefs.min_investment),
              maxInvestment: str(prefs.max_investment),
              minRatePct: str(prefs.min_rate_pct),
              maxTermMonths: str(prefs.max_term_months),
              maxLtvPct: str(prefs.max_ltv_pct),
              preferredProvinces: prefs.preferred_provinces,
              guaranteeTypes: prefs.guarantee_types,
              paymentPreference: prefs.payment_preference ?? "",
              prepaymentConditions: prefs.prepayment_conditions ?? "",
              riskTolerance: prefs.risk_tolerance ?? "",
            }}
          />
        </div>
      ) : (
        <Alert tone="warning">No encontramos tu perfil de inversión. Contacta a Trust Capital.</Alert>
      )}
    </>
  );
}
