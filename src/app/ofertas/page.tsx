import { headers } from "next/headers";
import type { Metadata } from "next";
import { ExternalOffersEmbed } from "@/components/ExternalOffersEmbed";
import { OfferCards } from "@/components/OfferCard";
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

export async function generateMetadata(): Promise<Metadata> {
  if (isArenaHost(await requestHost())) {
    return {
      title: `${ARENA_SITE_NAME} — Ofertas`,
      description: ARENA_SITE_DESCRIPTION,
      alternates: {
        canonical: `${ARENA_SITE_URL}/ofertas`,
      },
      openGraph: {
        title: `${ARENA_SITE_NAME} — Ofertas`,
        description: ARENA_SITE_DESCRIPTION,
      },
    };
  }

  return {
    title: "Ofertas",
    description:
      "As melhores ofertas e bónus exclusivos dos casinos online. Promoções verificadas e atualizadas.",
    openGraph: {
      title: "Ofertas | BRUTUSPOLUS",
      description: "As melhores ofertas e bónus exclusivos dos casinos online.",
    },
  };
}

export default async function OfertasPage() {
  const arenaHost = isArenaHost(await requestHost());

  return (
    <div className="relative pb-16">
      <div className="relative z-10 pb-16 pt-16">
        <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-6">
          {arenaHost ? <ExternalOffersEmbed /> : <OfferCards />}
        </div>
      </div>
    </div>
  );
}
