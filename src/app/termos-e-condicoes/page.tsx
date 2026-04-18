import type { Metadata } from "next";
import { TermsAndConditions } from "@/components/TermsAndConditions";

export const metadata: Metadata = {
  title: "Termos & Condições | BRUTUSPOLUS",
  description: "Termos e condições de utilização do website BRUTUSPOLUS.",
};

export default function TermsPage() {
  return <TermsAndConditions hideTitle />;
}
