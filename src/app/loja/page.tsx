"use client";

import { useAuth } from "@/lib/auth-context";
import { useArmorySound } from "@/hooks/useArmorySound";
import { RewardCard, type Reward } from "@/components/RewardCard";
import { VipBadge, getVipLevel } from "@/components/VipBadge";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";

export default function LojaPage() {
  const { user } = useAuth();
  const { init, play, vibrate } = useArmorySound();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [points, setPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const vipLevel = getVipLevel(points);

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
    <div className="relative min-h-screen overflow-hidden bg-black">
      {/* Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-black" />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "url('/images/pages/store.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            filter: "brightness(0.35) saturate(0.35) sepia(0.25) contrast(0.9) blur(2px)",
          }}
        />
        {/* Animated ember particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute w-1 h-1 rounded-full bg-arena-gold/30 animate-pulse" style={{ top: "20%", left: "15%", animationDelay: "0s", animationDuration: "3s" }} />
          <div className="absolute w-1.5 h-1.5 rounded-full bg-arena-crimson/20 animate-pulse" style={{ top: "60%", left: "80%", animationDelay: "1s", animationDuration: "4s" }} />
          <div className="absolute w-1 h-1 rounded-full bg-arena-gold/20 animate-pulse" style={{ top: "40%", left: "50%", animationDelay: "2s", animationDuration: "3.5s" }} />
          <div className="absolute w-0.5 h-0.5 rounded-full bg-arena-gold/40 animate-pulse" style={{ top: "75%", left: "30%", animationDelay: "0.5s", animationDuration: "2.5s" }} />
          <div className="absolute w-1 h-1 rounded-full bg-arena-crimson/25 animate-pulse" style={{ top: "10%", left: "70%", animationDelay: "1.5s", animationDuration: "4.5s" }} />
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading title="Armaria" subtitle="Recompensas forjadas para guerreiros" />

        {/* Loading skeletons */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="h-44 rounded-lg bg-white/[0.03] animate-pulse border border-white/[0.05]" />
            ))}
          </div>
        ) : rewards.length === 0 ? (
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-12 text-center">
            <p className="text-arena-ash text-lg">A armaria está vazia de momento.</p>
            <p className="text-arena-ash/60 text-sm mt-2">Volta em breve para novas recompensas!</p>
          </div>
        ) : (
          <>
            {/* Legendary Highlight Section */}
            {legendaryRewards.length > 0 && (
              <div className="mb-12">
                <h3 className="gladiator-label text-sm text-arena-crimson mb-4 flex items-center gap-2">
                  <span className="h-px flex-1 bg-gradient-to-r from-arena-crimson/30 to-transparent" />
                  🔥 Lendárias
                  <span className="h-px flex-1 bg-gradient-to-l from-arena-crimson/30 to-transparent" />
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {legendaryRewards.map((reward, i) => (
                    <motion.div
                      key={reward.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: i * 0.1 }}
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

            {/* Other rewards grid */}
            {otherRewards.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {otherRewards.map((reward, i) => (
                  <motion.div
                    key={reward.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.05 }}
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
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-xl border backdrop-blur-lg gladiator-label text-sm
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
