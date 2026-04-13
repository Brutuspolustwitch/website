"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useTwitchStatus } from "@/hooks/useTwitchStatus";
import { TWITCH_CHANNEL } from "@/lib/constants";
import { ArenaCard } from "@/components/ui/ArenaCard";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ScrollReveal } from "@/components/ui/ScrollReveal";

/**
 * STREAMER HUB — Live Twitch embed with gladiator status indicator.
 */
export function StreamerHub() {
  const { isLive, loading } = useTwitchStatus(TWITCH_CHANNEL);
  const [hostname, setHostname] = useState("localhost");

  useEffect(() => {
    setHostname(window.location.hostname);
  }, []);

  return (
    <section id="stream" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <ScrollReveal>
          <SectionHeading
            title="The Coliseum"
            subtitle="Watch the gladiator battle live. Every spin is a fight for glory."
          />
        </ScrollReveal>

        {/* Status indicator */}
        <ScrollReveal delay={0.1}>
          <div className="flex items-center justify-center gap-3 mb-8">
            <motion.div
              className={`w-3 h-3 rounded-full ${
                isLive ? "bg-green-500" : "bg-arena-ash"
              }`}
              animate={isLive ? { scale: [1, 1.3, 1], opacity: [1, 0.7, 1] } : {}}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            <span className="font-[family-name:var(--font-display)] text-sm sm:text-base tracking-widest uppercase">
              {loading ? (
                <span className="text-arena-smoke">Checking status...</span>
              ) : isLive ? (
                <span className="text-green-400 arena-glow">⚔️ IN THE ARENA</span>
              ) : (
                <span className="text-arena-ash">🏛️ RESTING IN THE COLISEUM</span>
              )}
            </span>
          </div>
        </ScrollReveal>

        {/* Stream embed with metal frame */}
        <ScrollReveal delay={0.2}>
          <ArenaCard variant="gold" className="p-1 sm:p-2 metal-frame-glow">
            <div className="relative w-full aspect-video bg-arena-black">
              <iframe
                src={`https://player.twitch.tv/?channel=${TWITCH_CHANNEL}&parent=${hostname}`}
                className="absolute inset-0 w-full h-full"
                allowFullScreen
                title={`${TWITCH_CHANNEL} live stream`}
              />
            </div>
          </ArenaCard>
        </ScrollReveal>

        {/* Chat embed */}
        <ScrollReveal delay={0.3}>
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <ArenaCard className="p-4">
                <h3 className="font-[family-name:var(--font-display)] text-arena-gold text-sm font-bold mb-2 tracking-wider">
                  ARENA CHAT
                </h3>
                <div className="aspect-[16/9] lg:aspect-[16/6] bg-arena-black">
                  <iframe
                    src={`https://www.twitch.tv/embed/${TWITCH_CHANNEL}/chat?parent=${hostname}&darkpopout`}
                    className="w-full h-full"
                    title="Twitch chat"
                  />
                </div>
              </ArenaCard>
            </div>

            {/* Stream info sidebar */}
            <div className="space-y-4">
              {/* Gladiator portrait */}
              <ArenaCard variant="gold" className="p-2 arena-shine">
                <div className="relative w-full aspect-square">
                  <img
                    src="/images/gladiator-portrait.jpg"
                    alt="Arena Gladiator"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-arena-black/80 via-transparent to-transparent" />
                  <div className="absolute bottom-3 left-3">
                    <p className="font-[family-name:var(--font-display)] text-arena-gold text-xs tracking-widest uppercase">⚔️ Your Gladiator</p>
                  </div>
                </div>
              </ArenaCard>

              <ArenaCard className="p-4">
                <h3 className="font-[family-name:var(--font-display)] text-arena-gold text-sm font-bold mb-3 tracking-wider">
                  GLADIATOR INFO
                </h3>
                <div className="space-y-3 text-sm text-arena-smoke">
                  <div className="flex justify-between">
                    <span>Schedule</span>
                    <span className="text-arena-white">Daily 18:00 CET</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Focus</span>
                    <span className="text-arena-white">Bonus Hunts</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Platform</span>
                    <span className="text-arena-white">Twitch</span>
                  </div>
                </div>
              </ArenaCard>

              <ArenaCard variant="crimson" className="p-4 text-center">
                <p className="font-[family-name:var(--font-display)] text-arena-gold text-xs tracking-wider mb-1">
                  NEXT BONUS HUNT
                </p>
                <p className="text-2xl font-bold text-arena-white arena-glow">
                  TONIGHT
                </p>
              </ArenaCard>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
