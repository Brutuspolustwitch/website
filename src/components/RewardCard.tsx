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
    border: "border-arena-steel/40",
    bg: "from-arena-charcoal to-arena-dark",
    badge: "bg-arena-steel/30 text-arena-smoke",
    glow: "",
  },
  elite: {
    border: "border-arena-gold/30",
    bg: "from-[#1a1710] to-arena-dark",
    badge: "bg-arena-gold/20 text-arena-gold",
    glow: "shadow-[0_0_20px_rgba(212,168,67,0.1)]",
  },
  legendary: {
    border: "border-arena-crimson/40",
    bg: "from-[#1a0a0a] to-arena-dark",
    badge: "bg-arena-crimson/20 text-arena-red",
    glow: "shadow-[0_0_30px_rgba(139,0,0,0.2),0_0_60px_rgba(212,168,67,0.08)]",
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
      className={`group relative rounded-xl border ${style.border} bg-gradient-to-b ${style.bg} ${style.glow}
                  overflow-hidden transition-all duration-300 hover:scale-[1.02] arena-shine`}
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
    >
      {/* Legendary animated aura */}
      {reward.tier === "legendary" && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-t from-arena-crimson/10 via-transparent to-arena-gold/5 animate-pulse" />
          <div className="absolute -inset-1 bg-gradient-to-r from-arena-gold/0 via-arena-gold/10 to-arena-gold/0 blur-xl opacity-40 animate-[shimmer_3s_ease-in-out_infinite]" />
        </div>
      )}

      {/* Elite glow top accent */}
      {reward.tier === "elite" && (
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-arena-gold/60 to-transparent" />
      )}

      {/* VIP Lock overlay */}
      {isLocked && (
        <div className="absolute inset-0 z-20 bg-black/70 backdrop-blur-[2px] flex flex-col items-center justify-center gap-1.5">
          <svg className="w-5 h-5 text-arena-ash/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 10.5V 6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
          </svg>
          <span className="gladiator-label text-xs text-arena-ash/80">
            {outOfStock ? "Esgotado" : `Requer VIP ${reward.vip_level_required}`}
          </span>
        </div>
      )}

      {/* Image */}
      {reward.image && (
        <div className="aspect-[16/9] max-h-28 w-full overflow-hidden bg-black/30">
          <img
            src={reward.image}
            alt={reward.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
          />
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 p-3">
        {/* Tier + Type badges */}
        <div className="flex items-center gap-1.5 mb-2">
          <span className={`text-[9px] px-1.5 py-0.5 rounded-full gladiator-label uppercase ${style.badge}`}>
            {reward.tier}
          </span>
          <span className="text-xs">{typeIcons[reward.type] || "⚡"}</span>
        </div>

        <h3 className="gladiator-label text-sm text-arena-white mb-0.5">{reward.title}</h3>
        {reward.description && (
          <p className="text-[10px] text-arena-smoke/70 line-clamp-2 mb-2">{reward.description}</p>
        )}

        {/* Cost + Stock */}
        <div className="flex items-center justify-between mb-2">
          <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-bold gladiator-label
            ${canAfford && !isLocked ? "border-arena-gold/30 bg-arena-gold/10 text-arena-gold" : "border-arena-steel/20 bg-arena-steel/10 text-arena-ash"}`}>
            ⭐ {reward.cost.toLocaleString()} pts
          </span>

          {reward.stock !== null && (
            <span className="text-[9px] text-arena-ash gladiator-label">
              {reward.stock} restantes
            </span>
          )}
        </div>

        {/* Cooldown indicator */}
        {reward.cooldown && (
          <p className="text-[9px] text-arena-ash/60 mb-2">⏱ Cooldown: {reward.cooldown}h</p>
        )}

        {/* Redeem button */}
        <AnimatePresence mode="wait">
          {redeemed ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="w-full py-1.5 rounded-md bg-green-900/40 border border-green-500/30 text-center gladiator-label text-[10px] text-green-400"
            >
              ✓ Resgatado!
            </motion.div>
          ) : (
            <motion.button
              key="redeem"
              onClick={handleRedeem}
              disabled={isLocked || !canAfford || redeeming}
              className={`w-full py-1.5 rounded-md gladiator-label text-[10px] font-bold arena-btn-press transition-all
                ${isLocked || !canAfford
                  ? "bg-arena-steel/20 border border-arena-steel/10 text-arena-ash/50 cursor-not-allowed"
                  : "bg-gradient-to-b from-arena-crimson to-arena-blood border border-arena-red/40 text-arena-white hover:from-arena-red hover:to-arena-crimson shadow-lg shadow-arena-crimson/20 cursor-pointer"
                }`}
              whileHover={!isLocked && canAfford ? { scale: 1.02 } : undefined}
              whileTap={!isLocked && canAfford ? { scale: 0.96 } : undefined}
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
