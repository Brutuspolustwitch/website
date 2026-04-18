import type { Metadata } from "next";
import { PrivacyPolicy } from "@/components/PrivacyPolicy";

export const metadata: Metadata = {
  title: "Política de Privacidade | BRUTUSPOLUS",
  description: "Política de privacidade do website BRUTUSPOLUS.",
};

export default function PrivacyPage() {
  return <PrivacyPolicy hideTitle />;
}
