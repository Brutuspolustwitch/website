"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArenaCard } from "@/components/ui/ArenaCard";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { STAGGER_CONTAINER, STAGGER_ITEM } from "@/lib/animations";
import { useAuth } from "@/lib/auth-context";

interface SELeaderboardEntry {
  username: string;
  points: number;
  rank: number;
}

/**
 * LEADERBOARD PAGE — Real-time StreamElements points leaderboard
 * 
 * Shows top users by SE points on the channel.
 * Updates every 60 seconds via API cache.
 */
export default function LeaderboardPage() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<SELeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        const res = await fetch("/api/streamelements?endpoint=leaderboard");
        if (!res.ok) throw new Error("Failed to fetch leaderboard");
        
        const data = await res.json();
        
        // SE API returns { users: [...] }
        if (data.users && Array.isArray(data.users)) {
          setEntries(data.users);
        } else {
          setEntries([]);
        }
        setError(null);
      } catch (err) {
        console.error("Leaderboard fetch error:", err);
        setError("Não foi possível carregar o leaderboard");
      } finally {
        setLoading(false);
      }
    }

    fetchLeaderboard();
    
    // Refresh every 2 minutes
    const interval = setInterval(fetchLeaderboard, 120000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="pt-24 pb-16 min-h-screen">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-3">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <ArenaCard className="p-4">
                  <div className="h-12 bg-arena-charcoal/50 rounded" />
                </ArenaCard>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pt-24 pb-16 min-h-screen">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <ArenaCard className="p-8 text-center">
            <p className="text-arena-smoke/70">{error}</p>
          </ArenaCard>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-16 min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Leaderboard table */}
        {entries.length === 0 ? (
          <ScrollReveal delay={0.2}>
            <ArenaCard className="p-8 text-center">
              <p className="text-arena-smoke/70">Nenhum dado disponível no momento.</p>
            </ArenaCard>
          </ScrollReveal>
        ) : (
          <motion.div
            variants={STAGGER_CONTAINER}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="space-y-3"
          >
            {/* Current user position banner */}
            {(() => {
              if (!user) return null;
              const pos = entries.findIndex(e => e.username.toLowerCase() === user.login.toLowerCase());
              if (pos === -1) return null;
              const e = entries[pos];
              return (
                <ArenaCard
                  variant="gold"
                  className="mb-2 px-6 py-3"
                  style={{
                    background: "linear-gradient(160deg, #1e1a0e 0%, #1a1a1a 50%, #1e1a0e 100%)",
                    border: "1px solid rgba(212,168,67,0.45)",
                    boxShadow: "inset 0 0 30px rgba(0,0,0,0.6), 0 0 20px rgba(212,168,67,0.12)",
                  }}
                >
                  <div className="flex items-center justify-center gap-4">
                    <span className="text-arena-gold/70 text-lg select-none">⚔</span>
                    <div className="flex items-baseline gap-3">
                      <span className="font-[family-name:var(--font-display)] text-[10px] uppercase tracking-[0.25em] text-white">
                        A tua posição
                      </span>
                      <span
                        className="font-[family-name:var(--font-display)] text-2xl font-black arena-glow"
                        style={{
                          background: "linear-gradient(160deg,#cd7f32 0%,#d4a843 30%,#f0d78c 50%,#d4a843 70%,#cd7f32 100%)",
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                          backgroundClip: "text",
                        }}
                      >
                        #{pos + 1}
                      </span>
                      <span className="font-[family-name:var(--font-display)] text-white text-xs tracking-wider">
                        · {e.points.toLocaleString("pt-PT")} pts
                      </span>
                    </div>
                    <span className="text-arena-gold/70 text-lg select-none">⚔</span>
                  </div>
                </ArenaCard>
              );
            })()}
            {entries.map((entry, i) => {
              // Format points with thousands separator
              const formattedPoints = entry.points.toLocaleString("pt-PT");
              const isMe = user && entry.username.toLowerCase() === user.login.toLowerCase();

              return (
                <motion.div key={`${entry.username}-${i}`} variants={STAGGER_ITEM}>
                  <ArenaCard
                    variant={i < 3 ? "gold" : "default"}
                    className="p-4 arena-shine hover:border-arena-gold/50 transition-colors"
                    style={isMe ? {
                      background: "linear-gradient(160deg, #1e1a0e 0%, #1a1a1a 50%, #1e1a0e 100%)",
                      border: "1px solid rgba(212,168,67,0.5)",
                      boxShadow: "inset 0 0 24px rgba(0,0,0,0.5), 0 0 18px rgba(212,168,67,0.15)",
                    } : undefined}
                  >
                    <div className="flex items-center gap-4">
                      {/* Position / Medal */}
                      <div className="w-10 text-center">
                        {i < 3 ? (
                          <span className="text-2xl">
                            {i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"}
                          </span>
                        ) : (
                          <span className="font-[family-name:var(--font-display)] text-xl text-white/60">
                            {i + 1}
                          </span>
                        )}
                      </div>

                      {/* Username */}
                      <div className="flex-1 min-w-0">
                        <p className="font-[family-name:var(--font-display)] text-arena-gold-light text-lg truncate">
                          {entry.username}
                        </p>
                      </div>

                      {/* Points */}
                      <div className="text-right">
                        <p className="font-[family-name:var(--font-display)] text-arena-gold-light text-xl font-bold">
                          {formattedPoints}
                        </p>
                        <p className="text-xs text-arena-smoke/60 uppercase tracking-wider">
                          Pontos
                        </p>
                      </div>
                    </div>
                  </ArenaCard>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* Bottom notice */}
        <div className="mt-8 text-center">
          <p className="text-arena-smoke/50 text-sm">
            Atualizado a cada 2 minutos • Top 50 membros
          </p>
        </div>
      </div>
    </div>
  );
}
