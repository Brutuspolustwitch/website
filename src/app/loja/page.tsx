"use client";

import { useAuth } from "@/lib/auth-context";
import { useArmorySound } from "@/hooks/useArmorySound";
import { RewardCard, type Reward } from "@/components/RewardCard";
import { VipBadge, getVipLevel } from "@/components/VipBadge";
import { useEffect, useState, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { useParticles } from "@/hooks/useParticles";

export default function LojaPage() {
  const { user } = useAuth();
  const { init, play, vibrate } = useArmorySound();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [points, setPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const vipLevel = getVipLevel(points);

  /* Ember particles — no rain, embers only */
  useParticles(canvasRef, { rainCount: 0, emberCount: 18, enabled: true });

  useEffect(() => {
    fetch("/api/rewards")
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d.rewards)) setRewards(d.rewards); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!user) return;
    fetch(`/api/streamelements?endpoint=user-points&username=${encodeURIComponent(user.login)}`)
      .then((r) => r.json())
      .then((d) => { if (typeof d.points === "number") setPoints(d.points); })
      .catch(() => {});
  }, [user]);

  useEffect(() => {
    const handler = () => { init(); window.removeEventListener("pointerdown", handler); };
    window.addEventListener("pointerdown", handler);
    return () => window.removeEventListener("pointerdown", handler);
  }, [init]);

  const showToast = useCallback((msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const handleRedeem = useCallback(async (rewardId: string): Promise<boolean> => {
    play("click");
    vibrate("click");

    try {
      const res = await fetch("/api/rewards/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rewardId }),
      });
      const data = await res.json();

      if (!res.ok) {
        showToast(data.error || "Falha ao resgatar", "error");
        return false;
      }

      play("redeem");
      vibrate("success");
      if (typeof data.newPoints === "number") setPoints(data.newPoints);

      setRewards((prev) =>
        prev.map((r) =>
          r.id === rewardId && r.stock !== null ? { ...r, stock: r.stock - 1 } : r
        )
      );

      showToast("Recompensa resgatada com sucesso!", "success");
      return true;
    } catch {
      showToast("Erro de rede", "error");
      return false;
    }
  }, [play, vibrate, showToast]);

  const legendaryRewards = rewards.filter((r) => r.tier === "legendary");
  const otherRewards = rewards.filter((r) => r.tier !== "legendary");

  return (
    <div className="relative min-h-screen bg-black overflow-hidden">
      {/* ── Background: Cinematic Armory ── */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-black" />
        {/* Store background with dark cinematic treatment */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "url('/images/pages/store.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            filter: "brightness(0.25) saturate(0.4) sepia(0.2) contrast(0.85)",
          }}
        />

        {/* Volumetric fog layers */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ animation: "armaria-fog-drift 20s ease-in-out infinite" }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent" />
        </div>
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ animation: "armaria-fog-drift 28s ease-in-out infinite 8s" }}
        >
          <div className="absolute inset-0 bg-gradient-to-l from-transparent via-arena-ember/[0.01] to-transparent" />
        </div>

        {/* Torch glow — left side */}
        <div
          className="absolute top-[15%] -left-[5%] w-[300px] h-[400px] rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(255,111,0,0.06) 0%, transparent 70%)",
            animation: "armaria-torch-flicker 2s ease-in-out infinite",
          }}
        />
        {/* Torch glow — right side */}
        <div
          className="absolute top-[25%] -right-[5%] w-[350px] h-[450px] rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(212,168,67,0.05) 0%, transparent 70%)",
            animation: "armaria-torch-flicker 2.4s ease-in-out infinite 0.8s",
          }}
        />
        {/* Bottom warm glow */}
        <div
          className="absolute bottom-0 left-0 right-0 h-[40%] pointer-events-none"
          style={{
            background: "linear-gradient(to top, rgba(139,0,0,0.06), transparent)",
          }}
        />

        {/* Edge vignette */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            boxShadow: "inset 0 0 150px 60px rgba(0,0,0,0.7), inset 0 0 300px 100px rgba(0,0,0,0.4)",
          }}
        />
      </div>

      {/* Ember particle canvas (reuses existing useParticles hook) */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 z-[1] pointer-events-none"
        style={{ width: "100%", height: "100%" }}
      />

      {/* ── Main Content ── */}
      <div className="relative z-10 pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* ── Section Header: ARMARIA ── */}
          <div className="text-center mb-16">
            {/* Decorative top ornament */}
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="h-px w-16 bg-gradient-to-r from-transparent to-arena-gold/30" />
              <div className="flex items-center gap-2">
                <span className="text-arena-gold/40 text-xs">⚔</span>
                <span className="text-arena-gold/20 text-[10px] font-[family-name:var(--font-display)] tracking-[0.3em] uppercase">
                  Arena Store
                </span>
                <span className="text-arena-gold/40 text-xs">⚔</span>
              </div>
              <div className="h-px w-16 bg-gradient-to-l from-transparent to-arena-gold/30" />
            </div>

            <h1 className="gladiator-title text-4xl sm:text-5xl lg:text-6xl mb-4" data-text="ARMARIA">
              ARMARIA
            </h1>

            <p className="font-[family-name:var(--font-display)] text-sm sm:text-base text-arena-smoke/50 tracking-[0.25em] uppercase">
              Recompensas forjadas para guerreiros
            </p>

            {/* Decorative sword divider */}
            <div className="mt-8 flex items-center justify-center gap-3">
              <div className="h-px w-20 sm:w-32 bg-gradient-to-r from-transparent via-arena-gold/30 to-arena-gold/10" />
              <div className="relative">
                <span className="text-arena-gold/50 text-base">🗡️</span>
              </div>
              <div className="h-px w-20 sm:w-32 bg-gradient-to-l from-transparent via-arena-gold/30 to-arena-gold/10" />
            </div>
          </div>

          {/* Loading skeletons — relic card style */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="rounded-xl bg-gradient-to-b from-[#1a1a1a] to-[#111] border border-white/[0.06] overflow-hidden">
                  {/* Image skeleton */}
                  <div className="aspect-[16/10] bg-white/[0.03] animate-pulse" />
                  <div className="p-4 space-y-3">
                    {/* Badge skeleton */}
                    <div className="h-5 w-20 bg-white/[0.04] rounded animate-pulse" />
                    {/* Title skeleton */}
                    <div className="h-4 w-3/4 bg-white/[0.04] rounded animate-pulse" />
                    {/* Description skeleton */}
                    <div className="h-3 w-full bg-white/[0.03] rounded animate-pulse" />
                    {/* Cost skeleton */}
                    <div className="h-8 w-28 bg-white/[0.04] rounded animate-pulse" />
                    {/* Button skeleton */}
                    <div className="h-10 w-full bg-white/[0.04] rounded-lg animate-pulse mt-1" />
                  </div>
                </div>
              ))}
            </div>
          ) : rewards.length === 0 ? (
            <div className="rounded-xl border border-white/[0.06] bg-gradient-to-b from-[#1a1a1a] to-[#111] p-12 text-center">
              <div className="text-4xl mb-4 opacity-30">🏛️</div>
              <p className="font-[family-name:var(--font-display)] text-arena-smoke/60 text-lg tracking-wide">
                A armaria está vazia de momento.
              </p>
              <p className="text-arena-smoke/30 text-sm mt-2">Volta em breve para novas recompensas forjadas!</p>
            </div>
          ) : (
            <>
              {/* ── Legendary Rewards Section ── */}
              {legendaryRewards.length > 0 && (
                <div className="mb-14">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent to-arena-crimson/20" />
                    <h3 className="font-[family-name:var(--font-display)] text-xs text-arena-crimson/70 tracking-[0.25em] uppercase flex items-center gap-3">
                      <span className="text-base">🔥</span>
                      Relíquias Lendárias
                      <span className="text-base">🔥</span>
                    </h3>
                    <div className="h-px flex-1 bg-gradient-to-l from-transparent to-arena-crimson/20" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {legendaryRewards.map((reward, i) => (
                      <motion.div
                        key={reward.id}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: i * 0.12 }}
                      >
                        <RewardCard
                          reward={reward}
                          userPoints={points}
                          userVipLevel={vipLevel}
                          onRedeem={handleRedeem}
                          onHover={() => { play("hover"); vibrate("hover"); }}
                          onClick={() => { play("click"); vibrate("click"); }}
                        />
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Arsenal Grid — Other Rewards ── */}
              {otherRewards.length > 0 && (
                <div>
                  {legendaryRewards.length > 0 && (
                    <div className="flex items-center gap-4 mb-6">
                      <div className="h-px flex-1 bg-gradient-to-r from-transparent to-arena-gold/15" />
                      <h3 className="font-[family-name:var(--font-display)] text-xs text-arena-gold/50 tracking-[0.25em] uppercase flex items-center gap-3">
                        <span className="text-base">⚔️</span>
                        Arsenal
                        <span className="text-base">⚔️</span>
                      </h3>
                      <div className="h-px flex-1 bg-gradient-to-l from-transparent to-arena-gold/15" />
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                    {otherRewards.map((reward, i) => (
                      <motion.div
                        key={reward.id}
                        initial={{ opacity: 0, y: 25 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: i * 0.06 }}
                      >
                        <RewardCard
                          reward={reward}
                          userPoints={points}
                          userVipLevel={vipLevel}
                          onRedeem={handleRedeem}
                          onHover={() => { play("hover"); vibrate("hover"); }}
                          onClick={() => { play("click"); vibrate("click"); }}
                        />
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Toast notification */}
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-xl border backdrop-blur-lg font-[family-name:var(--font-display)] text-xs tracking-[0.15em] uppercase
            ${toast.type === "success"
              ? "bg-green-900/60 border-green-500/30 text-green-300"
              : "bg-red-900/60 border-red-500/30 text-red-300"
            }`}
        >
          {toast.msg}
        </motion.div>
      )}
    </div>
  );
}
