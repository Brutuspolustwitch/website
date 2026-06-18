import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/admin/",
          "/moderador/",
          "/perfil/",
          "/go/",
        ],
      },
    ],
    sitemap: `${process.env.NEXT_PUBLIC_SITE_URL || "https://www.brutuspolus.com"}/sitemap.xml`,
  };
}
