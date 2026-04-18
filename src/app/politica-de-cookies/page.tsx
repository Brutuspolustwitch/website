import type { Metadata } from "next";
import { CookiePolicy } from "@/components/CookiePolicy";

export const metadata: Metadata = {
  title: "Política de Cookies | OSECAADEGAS95",
  description: "Política de cookies do website OSECAADEGAS95.",
};

export default function CookiePolicyPage() {
  return <CookiePolicy hideTitle />;
}
