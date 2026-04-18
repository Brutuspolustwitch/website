import type { Metadata } from "next";
import { CookiePolicy } from "@/components/CookiePolicy";

export const metadata: Metadata = {
  title: "Política de Cookies | BRUTUSPOLUS",
  description: "Política de cookies do website BRUTUSPOLUS.",
};

export default function CookiePolicyPage() {
  return <CookiePolicy hideTitle />;
}
