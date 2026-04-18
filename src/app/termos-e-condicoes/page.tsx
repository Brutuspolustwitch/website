import type { Metadata } from "next";
import { TermsAndConditions } from "@/components/TermsAndConditions";

export const metadata: Metadata = {
  title: "Termos & Condições | OSECAADEGAS95",
  description: "Termos e condições de utilização do website OSECAADEGAS95.",
};

export default function TermsPage() {
  return <TermsAndConditions hideTitle />;
}
