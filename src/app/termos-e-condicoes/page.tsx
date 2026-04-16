import type { Metadata } from "next";
import { TermsAndConditions } from "@/components/TermsAndConditions";

export const metadata: Metadata = {
  title: "Termos & Condições | BrutusPolus",
  description: "Termos e condições de utilização do website BrutusPolus.",
};

export default function TermsPage() {
  return <TermsAndConditions hideTitle />;
}
