import { SITE_URL } from "@/lib/constants";
import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    "",
    "/sobre",
    "/ofertas",
    "/destaques",
    "/stream",
    "/liga-dos-brutus",
    "/torneio",
    "/loja",
    "/contactos",
  ];

  return routes.map((route) => ({
    url: `${SITE_URL}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" ? "daily" : "weekly",
    priority: route === "" ? 1 : route.startsWith("/casinos/") ? 0.8 : 0.7,
  }));
}
