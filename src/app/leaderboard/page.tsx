"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArenaCard } from "@/components/ui/ArenaCard";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { STAGGER_CONTAINER, STAGGER_ITEM } from "@/lib/animations";

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
          <div className="text-center mb-12">
            <h1 className="font-[family-name:var(--font-display)] text-4xl md:text-5xl text-arena-gold tracking-wide mb-4">
              Leaderboard
            </h1>
          </div>
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
          <div className="text-center">
            <h1 className="font-[family-name:var(--font-display)] text-4xl md:text-5xl text-arena-gold tracking-wide mb-4">
              Leaderboard
            </h1>
            <ArenaCard className="p-8 text-center">
              <p className="text-arena-smoke/70">{error}</p>
            </ArenaCard>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-16 min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <ScrollReveal>
          <SectionHeading
            title="Leaderboard"
            subtitle="Top membros da comunidade por pontos StreamElements"
          />
        </ScrollReveal>

        {/* Info Card */}
        <ScrollReveal delay={0.1}>
          <ArenaCard className="p-4 mb-8 bg-arena-charcoal/40 border-arena-gold/20">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🏆</span>
              <div className="flex-1">
                <p className="text-arena-smoke/70 text-sm leading-relaxed">
                  <span className="text-arena-gold font-medium">Como ganhar pontos:</span> Assiste às streams, participa no chat, completa desafios e contribui para a comunidade!
                </p>
              </div>
            </div>
          </ArenaCard>
        </ScrollReveal>

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
            {entries.map((entry, i) => {
              // Format points with thousands separator
              const formattedPoints = entry.points.toLocaleString("pt-PT");

              return (
                <motion.div key={`${entry.username}-${i}`} variants={STAGGER_ITEM}>
                  <ArenaCard
                    variant={i < 3 ? "gold" : "default"}
                    className="p-4 arena-shine hover:border-arena-gold/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      {/* Position / Medal */}
                      <div className="w-10 text-center">
                        {i < 3 ? (
                          <span className="text-2xl">
                            {i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"}
                          </span>
                        ) : (
                          <span className="font-[family-name:var(--font-display)] text-xl text-arena-ash">
                            {entry.rank}
                          </span>
                        )}
                      </div>

                      {/* Username */}
                      <div className="flex-1 min-w-0">
                        <p className="font-[family-name:var(--font-display)] text-arena-gold text-lg truncate">
                          {entry.username}
                        </p>
                      </div>

                      {/* Points */}
                      <div className="text-right">
                        <p className="font-[family-name:var(--font-display)] text-arena-gold text-xl font-bold">
                          {formattedPoints}
                        </p>
                        <p className="text-xs text-arena-ash uppercase tracking-wider">
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
