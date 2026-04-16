import type { Metadata } from "next";
import { PrivacyPolicy } from "@/components/PrivacyPolicy";

export const metadata: Metadata = {
  title: "Política de Privacidade | BrutusPolus",
  description: "Política de privacidade do website BrutusPolus.",
};

export default function PrivacyPage() {
  return <PrivacyPolicy hideTitle />;
}
