import type { Metadata } from "next";
import { LegalDocument } from "@/components/public/legal-document";
import { getActiveAgreements } from "@/server/agreements";

export const metadata: Metadata = { title: "Términos y condiciones" };
export const revalidate = 300;

export default async function TermsPage() {
  const { terms } = await getActiveAgreements(["terms"]);
  return <LegalDocument doc={terms} fallbackTitle="Términos y condiciones" />;
}
