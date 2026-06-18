import type { Metadata } from "next";
import { Cinzel, Bebas_Neue } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/AppShell";
import { SITE_NAME, SITE_DESCRIPTION, SITE_URL } from "@/lib/constants";

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: SITE_URL,
      logo: `${SITE_URL}/images/logo.png`,
      sameAs: [
        "https://www.twitch.tv/brutuspolus",
      ],
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE_NAME,
      description: SITE_DESCRIPTION,
      inLanguage: "pt-PT",
      publisher: {
        "@id": `${SITE_URL}/#organization`,
      },
    },
  ],
};

const cinzel = Cinzel({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  display: "swap",
});

const bebasNeue = Bebas_Neue({
  variable: "--font-ui",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — Enter the Arena`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "casino streamer",
    "igaming",
    "bonus hunt",
    "slots",
    "gladiator",
    "arena",
    "live stream",
    "casino bonus",
    "casino online portugal",
    "streamer casino",
    "Liga dos Brutus",
    "torneio slots",
    "casino ao vivo",
  ],
  openGraph: {
    type: "website",
    locale: "pt_PT",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} — Enter the Arena`,
    description: SITE_DESCRIPTION,
    images: [{ url: "/images/og-image.jpg", width: 1200, height: 630, alt: SITE_NAME }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — Enter the Arena`,
    description: SITE_DESCRIPTION,
    images: ["/images/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large" as const,
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/icon.png", sizes: "192x192", type: "image/png" },
      { url: "/icon.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt"
      className={`${cinzel.variable} ${bebasNeue.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-arena-black text-arena-white">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
