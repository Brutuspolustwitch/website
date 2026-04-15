import type { Metadata } from "next";
import { StreamerHub } from "@/components/StreamerHub";
import DailySessionContent from "@/components/DailySession";
import { DestaquesContent } from "@/components/DestaquesContent";
import { SectionHeading } from "@/components/ui/SectionHeading";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Live Stream",
  description: "Watch the gladiator battle live on Twitch. Real-time casino streaming, bonus hunts, and slot battles.",
  openGraph: {
    title: "Live Stream | Arena Gladiator",
    description: "Watch the gladiator battle live on Twitch.",
  },
};

export default function LivePage() {
  return (
    <div className="pt-16">
      <StreamerHub />

      {/* Sessão do Dia */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <DailySessionContent />
        </div>
      </section>

      {/* Destaques — Clips & VODs */}
      <section className="pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <SectionHeading
            title="Destaques"
            subtitle="Clips e VODs do canal — atualizado automaticamente"
          />
          <div className="mt-10">
            <DestaquesContent />
          </div>
        </div>
      </section>
    </div>
  );
}
