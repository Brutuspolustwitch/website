import { ExternalOffersEmbed } from "@/components/ExternalOffersEmbed";
import { generateWebsiteSchema } from "@/lib/schema";
import type { Metadata } from "next";
import { SITE_NAME, SITE_DESCRIPTION, SITE_URL } from "@/lib/constants";

export const metadata: Metadata = {
  title: `${SITE_NAME} — Enter the Arena`,
  description: SITE_DESCRIPTION,
  alternates: {
    canonical: SITE_URL,
  },
};

export default function HomePage() {
  const websiteSchema = generateWebsiteSchema();
  const orgSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/images/logo.png`,
    sameAs: [
      `https://www.twitch.tv/brutuspolus`,
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
      />
      <main className="relative z-10 pt-16 pb-16">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-6">
          <ExternalOffersEmbed />
        </div>
      </main>
    </>
  );
}
