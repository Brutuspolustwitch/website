import type { Metadata } from "next";
import UserAnalytics from "@/components/analytics/UserAnalytics";

export const metadata: Metadata = {
  title: "Utilizadores — Analitics",
  description: "Análise de utilizadores da Arena Gladiator.",
};

export default function UserAnalyticsPage() {
  return <UserAnalytics />;
}
