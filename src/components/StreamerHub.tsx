"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useTwitchStatus } from "@/hooks/useTwitchStatus";
import { TWITCH_CHANNEL } from "@/lib/constants";
import { ScrollReveal } from "@/components/ui/ScrollReveal";

interface TwitchClip {
  id: string;
  embed_url: string;
  title: string;
  creator_name: string;
  view_count: number;
}

/**
 * STREAMER HUB — Live Twitch embed + chat side by side.
 * When offline, plays a random clip from the channel.
 */
export function StreamerHub() {
  const { isLive, loading } = useTwitchStatus(TWITCH_CHANNEL);
  const [hostname, setHostname] = useState("localhost");
  const [clips, setClips] = useState<TwitchClip[]>([]);
  const [activeClip, setActiveClip] = useState<TwitchClip | null>(null);

  useEffect(() => {
    setHostname(window.location.hostname);
  }, []);

  // Fetch clips when we detect offline
  useEffect(() => {
    if (loading || isLive) return;

    async function fetchClips() {
      try {
        const res = await fetch(
          `/api/twitch-clips?channel=${encodeURIComponent(TWITCH_CHANNEL)}&limit=20`
        );
        const data = await res.json();
        const fetched: TwitchClip[] = data.clips ?? [];
        if (fetched.length > 0) {
          setClips(fetched);
          setActiveClip(fetched[Math.floor(Math.random() * fetched.length)]);
        }
      } catch {
        /* silently fail — player stays on channel page */
      }
    }

    fetchClips();
  }, [loading, isLive]);

  const shuffleClip = useCallback(() => {
    if (clips.length < 2) return;
    let next: TwitchClip;
    do {
      next = clips[Math.floor(Math.random() * clips.length)];
    } while (next.id === activeClip?.id);
    setActiveClip(next);
  }, [clips, activeClip]);

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
                <span className="text-green-400 arena-glow">EM DIRETO</span>
              ) : (
                <span className="text-arena-ash">OFFLINE</span>
              )}
            </span>
          </div>
        </ScrollReveal>

        {/* Stream + Chat side by side */}
        <ScrollReveal delay={0.1}>
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-4">
            {/* Stream / Clip player */}
            <div className="relative w-full aspect-video bg-arena-black rounded-2xl overflow-hidden arena-border-crimson metal-frame-glow shadow-2xl shadow-black/60">
              {isLive || loading ? (
                <iframe
                  src={`https://player.twitch.tv/?channel=${TWITCH_CHANNEL}&parent=${hostname}`}
                  className="absolute inset-0 w-full h-full"
                  allowFullScreen
                  title={`${TWITCH_CHANNEL} live stream`}
                />
              ) : activeClip ? (
                <iframe
                  key={activeClip.id}
                  src={`${activeClip.embed_url}&parent=${hostname}&autoplay=true&muted=false`}
                  className="absolute inset-0 w-full h-full"
                  allowFullScreen
                  title={activeClip.title}
                />
              ) : (
                <iframe
                  src={`https://player.twitch.tv/?channel=${TWITCH_CHANNEL}&parent=${hostname}`}
                  className="absolute inset-0 w-full h-full"
                  allowFullScreen
                  title={`${TWITCH_CHANNEL} channel`}
                />
              )}

              {/* Clip info overlay */}
              {!isLive && !loading && activeClip && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 flex items-end justify-between pointer-events-none">
                  <div className="min-w-0">
                    <p className="text-white text-sm font-medium truncate">
                      {activeClip.title}
                    </p>
                    <p className="text-arena-smoke text-xs">
                      Clipped by {activeClip.creator_name} · {activeClip.view_count.toLocaleString()} views
                    </p>
                  </div>
                  {clips.length > 1 && (
                    <button
                      onClick={shuffleClip}
                      className="pointer-events-auto ml-3 shrink-0 px-3 py-1.5 rounded-lg bg-arena-crimson/30 hover:bg-arena-crimson/50 text-arena-gold text-xs font-medium tracking-wide uppercase transition-colors backdrop-blur-sm border border-arena-crimson/40 arena-btn-press"
                    >
                      Próximo clip
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Chat */}
            <div className="relative bg-arena-dark rounded-2xl overflow-hidden arena-border-crimson shadow-2xl shadow-black/60 min-h-[400px] lg:min-h-0">
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
