import type { Metadata } from "next";
import { LegalDocument } from "@/components/public/legal-document";
import { getActiveAgreements } from "@/server/agreements";

export const metadata: Metadata = { title: "Política de privacidad" };
export const revalidate = 300;

export default async function PrivacyPage() {
  const { privacy } = await getActiveAgreements(["privacy"]);
  return <LegalDocument doc={privacy} fallbackTitle="Política de privacidad" />;
}
