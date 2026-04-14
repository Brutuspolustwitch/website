import type { Metadata } from "next";
import { StreamerHub } from "@/components/StreamerHub";
import { SEOverlay } from "@/components/SEOverlay";

export const metadata: Metadata = {
  title: "Live Stream",
  description: "Watch the gladiator battle live on Twitch. Real-time casino streaming, bonus hunts, and slot battles.",
  openGraph: {
    title: "Live Stream | Arena Gladiator",
    description: "Watch the gladiator battle live on Twitch.",
  },
};

export default function StreamPage() {
  return (
    <div className="pt-16">
      <StreamerHub />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <SEOverlay />
      </div>
    </div>
  );
}
