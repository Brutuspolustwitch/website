import { SITE_URL } from "@/lib/constants";
import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes: Array<{
    path: string;
    changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
    priority: number;
  }> = [
    { path: "", changeFrequency: "daily", priority: 1 },
    { path: "/sobre", changeFrequency: "monthly", priority: 0.8 },
    { path: "/ofertas", changeFrequency: "daily", priority: 0.9 },
    { path: "/bonus-hunt", changeFrequency: "daily", priority: 0.9 },
    { path: "/daily-session", changeFrequency: "daily", priority: 0.8 },
    { path: "/live", changeFrequency: "daily", priority: 0.8 },
    { path: "/destaques", changeFrequency: "weekly", priority: 0.8 },
    { path: "/calendario", changeFrequency: "weekly", priority: 0.7 },
    { path: "/comunidade", changeFrequency: "weekly", priority: 0.8 },
    { path: "/giveaways", changeFrequency: "weekly", priority: 0.7 },
    { path: "/hall-of-victories", changeFrequency: "weekly", priority: 0.8 },
    { path: "/leaderboard", changeFrequency: "weekly", priority: 0.7 },
    { path: "/liga-dos-brutus", changeFrequency: "weekly", priority: 0.8 },
    { path: "/roda-diaria", changeFrequency: "weekly", priority: 0.6 },
    { path: "/adivinha-o-resultado", changeFrequency: "weekly", priority: 0.7 },
    { path: "/loja", changeFrequency: "weekly", priority: 0.6 },
    { path: "/politica-de-privacidade", changeFrequency: "yearly", priority: 0.2 },
    { path: "/politica-de-cookies", changeFrequency: "yearly", priority: 0.2 },
    { path: "/termos-e-condicoes", changeFrequency: "yearly", priority: 0.2 },
  ];

  return routes.map((route) => ({
    url: `${SITE_URL}${route.path}`,
    lastModified: new Date(),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
