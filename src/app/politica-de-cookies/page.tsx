import type { Metadata } from "next";
import { CookiePolicy } from "@/components/CookiePolicy";

export const metadata: Metadata = {
  title: "Política de Cookies | BrutusPolus",
  description: "Política de cookies do website BrutusPolus.",
};

export default function CookiePolicyPage() {
  return <CookiePolicy hideTitle />;
}
