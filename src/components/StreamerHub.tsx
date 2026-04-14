"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useTwitchStatus } from "@/hooks/useTwitchStatus";
import { TWITCH_CHANNEL } from "@/lib/constants";
import { ScrollReveal } from "@/components/ui/ScrollReveal";

/**
 * STREAMER HUB — Live Twitch embed + chat side by side.
 */
export function StreamerHub() {
  const { isLive, loading } = useTwitchStatus(TWITCH_CHANNEL);
  const [hostname, setHostname] = useState("localhost");

  useEffect(() => {
    setHostname(window.location.hostname);
  }, []);

  return (
    <section id="stream" className="py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[1400px] mx-auto">
        {/* Status indicator */}
        <ScrollReveal>
          <div className="flex items-center justify-center gap-3 mb-6">
            <motion.div
              className={`w-2.5 h-2.5 rounded-full ${
                isLive ? "bg-green-500" : "bg-arena-ash"
              }`}
              animate={isLive ? { scale: [1, 1.3, 1], opacity: [1, 0.7, 1] } : {}}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            <span className="font-[family-name:var(--font-display)] text-sm tracking-widest uppercase">
              {loading ? (
                <span className="text-arena-smoke">A verificar...</span>
              ) : isLive ? (
                <span className="text-green-400">EM DIRETO</span>
              ) : (
                <span className="text-arena-ash">OFFLINE</span>
              )}
            </span>
          </div>
        </ScrollReveal>

        {/* Stream + Chat side by side */}
        <ScrollReveal delay={0.1}>
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-4">
            {/* Stream player */}
            <div className="relative w-full aspect-video bg-arena-black rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-black/40">
              <iframe
                src={`https://player.twitch.tv/?channel=${TWITCH_CHANNEL}&parent=${hostname}`}
                className="absolute inset-0 w-full h-full"
                allowFullScreen
                title={`${TWITCH_CHANNEL} live stream`}
              />
            </div>

            {/* Chat */}
            <div className="relative bg-arena-dark rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-black/40 min-h-[400px] lg:min-h-0">
              <iframe
                src={`https://www.twitch.tv/embed/${TWITCH_CHANNEL}/chat?parent=${hostname}&darkpopout`}
                className="w-full h-full absolute inset-0"
                title="Twitch chat"
              />
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
