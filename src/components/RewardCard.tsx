"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export interface Reward {
  id: string;
  title: string;
  description: string;
  image: string | null;
  cost: number;
  type: string;
  tier: "common" | "elite" | "legendary";
  stock: number | null;
  cooldown: number | null;
  vip_only: boolean;
  vip_level_required: number | null;
  active: boolean;
  sort_order: number;
}

interface RewardCardProps {
  reward: Reward;
  userPoints: number;
  userVipLevel: number;
  onRedeem: (rewardId: string) => Promise<boolean>;
  onHover?: () => void;
  onClick?: () => void;
}

const tierStyles = {
  common: {
    border: "border-white/10",
    bg: "bg-white/[0.03]",
    badge: "bg-white/10 text-arena-smoke",
    glow: "",
    accent: "from-arena-steel/40 to-transparent",
  },
  elite: {
    border: "border-arena-gold/20",
    bg: "bg-white/[0.03]",
    badge: "bg-arena-gold/15 text-arena-gold",
    glow: "shadow-[0_0_24px_rgba(212,168,67,0.08)]",
    accent: "from-arena-gold/30 to-transparent",
  },
  legendary: {
    border: "border-arena-crimson/25",
    bg: "bg-white/[0.03]",
    badge: "bg-arena-crimson/15 text-red-400",
    glow: "shadow-[0_0_30px_rgba(139,0,0,0.12)]",
    accent: "from-arena-crimson/30 to-transparent",
  },
};

const typeIcons: Record<string, string> = {
  deposit: "💰",
  ticket: "🎟️",
  gift: "🎁",
  cash: "💵",
  custom: "⚡",
};

export function RewardCard({ reward, userPoints, userVipLevel, onRedeem, onHover, onClick }: RewardCardProps) {
  const [redeeming, setRedeeming] = useState(false);
  const [redeemed, setRedeemed] = useState(false);
  const [error, setError] = useState("");

  const style = tierStyles[reward.tier];
  const canAfford = userPoints >= reward.cost;
  const vipLocked = reward.vip_only && reward.vip_level_required !== null && userVipLevel < reward.vip_level_required;
  const outOfStock = reward.stock !== null && reward.stock <= 0;
  const isLocked = vipLocked || outOfStock;

  async function handleRedeem() {
    if (isLocked || !canAfford || redeeming || redeemed) return;
    onClick?.();
    setRedeeming(true);
    setError("");

    const success = await onRedeem(reward.id);
    if (success) {
      setRedeemed(true);
      setTimeout(() => setRedeemed(false), 3000);
    } else {
      setError("Falha ao resgatar");
      setTimeout(() => setError(""), 3000);
    }
    setRedeeming(false);
  }

  return (
    <motion.div
      layout
      onMouseEnter={onHover}
      className={`group relative rounded-2xl border ${style.border} ${style.bg} ${style.glow}
                  overflow-hidden transition-all duration-300 hover:border-arena-gold/30`}
      whileHover={{ y: -3 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
    >
      {/* Top accent line */}
      <div className={`absolute top-0 left-0 right-0 h-px bg-gradient-to-r ${style.accent}`} />

      {/* Legendary subtle pulse */}
      {reward.tier === "legendary" && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-t from-arena-crimson/5 via-transparent to-transparent animate-pulse" />
        </div>
      )}

      {/* VIP Lock overlay */}
      {isLocked && (
        <div className="absolute inset-0 z-20 bg-black/70 backdrop-blur-[2px] flex flex-col items-center justify-center gap-2">
          <svg className="w-6 h-6 text-arena-smoke/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 10.5V 6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
          </svg>
          <span className="text-xs text-arena-smoke/70 font-[family-name:var(--font-display)] tracking-wider">
            {outOfStock ? "Esgotado" : `Requer VIP ${reward.vip_level_required}`}
          </span>
        </div>
      )}

      {/* Image */}
      {reward.image && (
        <div className="aspect-[16/9] w-full overflow-hidden bg-black/20">
          <img
            src={reward.image}
            alt={reward.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 p-4">
        {/* Tier + Type badges */}
        <div className="flex items-center gap-2 mb-3">
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-[family-name:var(--font-display)] uppercase tracking-wider ${style.badge}`}>
            {reward.tier}
          </span>
          <span className="text-sm">{typeIcons[reward.type] || "⚡"}</span>
        </div>

        <h3 className="font-[family-name:var(--font-display)] text-base text-arena-white tracking-wide mb-1">{reward.title}</h3>
        {reward.description && (
          <p className="text-xs text-white/40 line-clamp-2 mb-3">{reward.description}</p>
        )}

        {/* Cost + Stock */}
        <div className="flex items-center justify-between mb-3">
          <span className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-bold font-[family-name:var(--font-display)] tracking-wide
            ${canAfford && !isLocked ? "border-arena-gold/25 bg-arena-gold/10 text-arena-gold" : "border-white/10 bg-white/5 text-arena-smoke"}`}>
            ⭐ {reward.cost.toLocaleString()} pts
          </span>

          {reward.stock !== null && (
            <span className="text-[10px] text-white/40 font-[family-name:var(--font-display)] tracking-wider">
              {reward.stock} restantes
            </span>
          )}
        </div>

        {/* Cooldown indicator */}
        {reward.cooldown && (
          <p className="text-[10px] text-white/30 mb-3">⏱ Cooldown: {reward.cooldown}h</p>
        )}

        {/* Redeem button */}
        <AnimatePresence mode="wait">
          {redeemed ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="w-full py-2 rounded-lg bg-green-900/30 border border-green-500/20 text-center font-[family-name:var(--font-display)] text-xs text-green-400 tracking-wider"
            >
              ✓ Resgatado!
            </motion.div>
          ) : (
            <motion.button
              key="redeem"
              onClick={handleRedeem}
              disabled={isLocked || !canAfford || redeeming}
              className={`w-full py-2 rounded-lg font-[family-name:var(--font-display)] text-xs tracking-wider font-bold transition-all
                ${isLocked || !canAfford
                  ? "bg-white/5 border border-white/10 text-white/25 cursor-not-allowed"
                  : "bg-gradient-to-r from-arena-crimson to-red-800 hover:from-red-700 hover:to-red-600 border border-arena-crimson/30 text-white cursor-pointer"
                }`}
              whileHover={!isLocked && canAfford ? { scale: 1.01 } : undefined}
              whileTap={!isLocked && canAfford ? { scale: 0.97 } : undefined}
            >
              {redeeming ? "A resgatar..." : !canAfford ? "Pontos insuficientes" : "Resgatar"}
            </motion.button>
          )}
        </AnimatePresence>

        {/* Error toast */}
        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-2 text-[10px] text-arena-red text-center"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
