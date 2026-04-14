import type { Metadata } from "next";
import { Uncial_Antiqua } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/AppShell";
import { SITE_NAME, SITE_DESCRIPTION, SITE_URL } from "@/lib/constants";

const uncialAntiqua = Uncial_Antiqua({
  variable: "--font-display",
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
    "liga dos brutus",
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
    images: [{ url: "/images/arena-gladiator.jpg", width: 1200, height: 630, alt: SITE_NAME }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — Enter the Arena`,
    description: SITE_DESCRIPTION,
    images: ["/images/arena-gladiator.jpg"],
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt"
      className={`${uncialAntiqua.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-arena-black text-arena-white">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
