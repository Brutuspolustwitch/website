import { headers } from "next/headers";
import { ExternalOffersEmbed } from "@/components/ExternalOffersEmbed";
import { HeroSection } from "@/components/HeroSection";
import { generateWebsiteSchema } from "@/lib/schema";
import type { Metadata } from "next";
import { SITE_NAME, SITE_DESCRIPTION, SITE_URL } from "@/lib/constants";
import {
  ARENA_SITE_DESCRIPTION,
  ARENA_SITE_NAME,
  ARENA_SITE_URL,
  isArenaHost,
} from "@/lib/siteHost";

async function requestHost() {
  const headerStore = await headers();
  return headerStore.get("x-forwarded-host") ?? headerStore.get("host");
}

function websiteSchema(name: string, description: string, url: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name,
    url,
    description,
    inLanguage: "pt-PT",
  };
}

export async function generateMetadata(): Promise<Metadata> {
  if (isArenaHost(await requestHost())) {
    return {
      title: `${ARENA_SITE_NAME} — Ofertas`,
      description: ARENA_SITE_DESCRIPTION,
      alternates: {
        canonical: ARENA_SITE_URL,
      },
      openGraph: {
        title: `${ARENA_SITE_NAME} — Ofertas`,
        description: ARENA_SITE_DESCRIPTION,
        url: ARENA_SITE_URL,
        siteName: ARENA_SITE_NAME,
      },
    };
  }

  return {
    title: `${SITE_NAME} — Enter the Arena`,
    description: SITE_DESCRIPTION,
    alternates: {
      canonical: SITE_URL,
    },
  };
}

export default async function HomePage() {
  const arenaHost = isArenaHost(await requestHost());
  const schema = arenaHost
    ? websiteSchema(ARENA_SITE_NAME, ARENA_SITE_DESCRIPTION, ARENA_SITE_URL)
    : generateWebsiteSchema();
  const orgSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: arenaHost ? ARENA_SITE_NAME : SITE_NAME,
    url: arenaHost ? ARENA_SITE_URL : SITE_URL,
    logo: `${arenaHost ? ARENA_SITE_URL : SITE_URL}/images/logo.png`,
    sameAs: ["https://www.twitch.tv/brutuspolus"],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
      />
      {arenaHost ? (
        <main className="relative z-10 pb-16 pt-16">
          <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-6">
            <ExternalOffersEmbed />
          </div>
        </main>
      ) : (
        <HeroSection />
      )}
    </>
  );
}
