import type { Metadata } from "next";
import { PrivacyPolicy } from "@/components/PrivacyPolicy";

export const metadata: Metadata = {
  title: "Política de Privacidade | OSECAADEGAS95",
  description: "Política de privacidade do website OSECAADEGAS95.",
};

export default function PrivacyPage() {
  return <PrivacyPolicy hideTitle />;
}
