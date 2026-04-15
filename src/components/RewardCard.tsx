"use client";

import { useState, useRef, useCallback } from "react";
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

const tierConfig = {
  common: {
    label: "COMMON",
    border: "border-[#3a3a3a]/40",
    hoverBorder: "hover:border-[#5a5a5a]/60",
    bg: "bg-gradient-to-b from-[#1a1a1a] to-[#111111]",
    badge: "bg-[#2a2a2a] text-[#888] border-[#3a3a3a]/50",
    glow: "",
    accent: "from-[#3a3a3a]/30 via-[#555]/20 to-transparent",
    imageOverlay: "from-[#3a3a3a]/30 to-transparent",
    frameColor: "rgba(90, 90, 90, 0.15)",
  },
  elite: {
    label: "ELITE",
    border: "border-arena-gold/20",
    hoverBorder: "hover:border-arena-gold/50",
    bg: "bg-gradient-to-b from-[#1c1810] to-[#12100c]",
    badge: "bg-arena-gold/10 text-arena-gold border-arena-gold/25",
    glow: "shadow-[0_0_30px_rgba(212,168,67,0.08)]",
    accent: "from-arena-gold/25 via-arena-gold/10 to-transparent",
    imageOverlay: "from-arena-gold/15 to-transparent",
    frameColor: "rgba(212, 168, 67, 0.12)",
  },
  legendary: {
    label: "LEGENDARY",
    border: "border-arena-crimson/25",
    hoverBorder: "hover:border-arena-ember/50",
    bg: "bg-gradient-to-b from-[#1a0f0f] to-[#100808]",
    badge: "bg-arena-crimson/15 text-red-400 border-arena-crimson/30",
    glow: "",
    accent: "from-arena-crimson/30 via-arena-ember/15 to-transparent",
    imageOverlay: "from-arena-crimson/20 to-transparent",
    frameColor: "rgba(139, 0, 0, 0.15)",
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
  const [striking, setStriking] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const tier = tierConfig[reward.tier];
  const canAfford = userPoints >= reward.cost;
  const vipLocked = reward.vip_only && reward.vip_level_required !== null && userVipLevel < reward.vip_level_required;
  const outOfStock = reward.stock !== null && reward.stock <= 0;
  const isLocked = vipLocked || outOfStock;

  /* 3D tilt on mouse move */
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const rotateX = (y - 0.5) * -8;
    const rotateY = (x - 0.5) * 8;
    cardRef.current.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-6px)`;
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (!cardRef.current) return;
    cardRef.current.style.transform = "perspective(800px) rotateX(0) rotateY(0) translateY(0)";
  }, []);

  async function handleRedeem() {
    if (isLocked || !canAfford || redeeming || redeemed) return;
    onClick?.();
    setStriking(true);
    setRedeeming(true);
    setError("");

    setTimeout(() => setStriking(false), 300);

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
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={onHover}
      className={`armaria-relic-card armaria-shimmer-sweep group relative rounded-xl border overflow-hidden
                  ${tier.border} ${tier.bg} ${tier.glow} ${tier.hoverBorder}
                  ${reward.tier === "legendary" ? "armaria-legendary-flame" : ""}
                  ${striking ? "animate-[armaria-strike_0.3s_ease]" : ""}
                  `}
      style={{ transformStyle: "preserve-3d", willChange: "transform" }}
    >
      {/* Top accent gradient bar */}
      <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${tier.accent} z-10`} />

      {/* Inner frame border — relic display effect */}
      <div
        className="absolute inset-[3px] rounded-[10px] pointer-events-none z-[5] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ border: `1px solid ${tier.frameColor}` }}
      />

      {/* Legendary flame particles */}
      {reward.tier === "legendary" && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-[2]">
          <div className="absolute bottom-0 left-[20%] w-1 h-1 rounded-full bg-arena-ember/60" style={{ animation: "armaria-ember-rise 3s ease-in infinite 0s" }} />
          <div className="absolute bottom-0 left-[50%] w-0.5 h-0.5 rounded-full bg-arena-gold/50" style={{ animation: "armaria-ember-drift 4s ease-in infinite 1s" }} />
          <div className="absolute bottom-0 left-[75%] w-1 h-1 rounded-full bg-arena-crimson/50" style={{ animation: "armaria-ember-rise 3.5s ease-in infinite 2s" }} />
        </div>
      )}

      {/* VIP Lock overlay */}
      {isLocked && (
        <div className="absolute inset-0 z-30 bg-black/75 backdrop-blur-[3px] flex flex-col items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-full bg-white/[0.04] border border-white/10 flex items-center justify-center">
            <svg className="w-5 h-5 text-arena-smoke/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 10.5V 6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>
          <span className="text-xs text-arena-smoke/70 font-[family-name:var(--font-display)] tracking-[0.2em] uppercase">
            {outOfStock ? "Esgotado" : `Requer VIP ${reward.vip_level_required}`}
          </span>
        </div>
      )}

      {/* ── Image / Relic Display ── */}
      {reward.image && (
        <div className="relative aspect-[16/10] w-full overflow-hidden">
          {/* Dark vignette frame */}
          <div className="absolute inset-0 z-[3] pointer-events-none"
            style={{
              boxShadow: "inset 0 0 40px 10px rgba(0,0,0,0.5), inset 0 -20px 30px -10px rgba(0,0,0,0.6)",
            }}
          />
          {/* Bottom gradient fade into content */}
          <div className={`absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t ${tier.imageOverlay} z-[2] pointer-events-none`} />

          <img
            src={reward.image}
            alt={reward.title}
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
            loading="lazy"
          />

          {/* Tier badge — engraved metal tag — positioned on image */}
          <div className="absolute top-3 left-3 z-[4]">
            <span className={`armaria-badge inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] ${tier.badge}`}>
              {typeIcons[reward.type] || "⚡"} {tier.label}
            </span>
          </div>
        </div>
      )}

      {/* If no image, show tier badge inline */}
      {!reward.image && (
        <div className="pt-4 px-4">
          <span className={`armaria-badge inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] ${tier.badge}`}>
            {typeIcons[reward.type] || "⚡"} {tier.label}
          </span>
        </div>
      )}

      {/* ── Content Section ── */}
      <div className="relative z-10 p-4 pt-3">
        {/* Title — Roman style, uppercase */}
        <h3 className="font-[family-name:var(--font-display)] text-sm text-arena-white uppercase tracking-[0.08em] leading-tight mb-1">
          {reward.title}
        </h3>

        {reward.description && (
          <p className="text-xs text-white/35 line-clamp-2 mb-3 leading-relaxed">{reward.description}</p>
        )}

        {/* Cost plaque + Stock */}
        <div className="flex items-center justify-between mb-3">
          {/* Gold coin / plaque style cost */}
          <div className={`inline-flex items-center gap-1.5 rounded border px-3 py-1.5 
            ${canAfford && !isLocked
              ? "border-arena-gold/25 bg-gradient-to-r from-arena-gold/10 to-arena-gold/5 text-arena-gold"
              : "border-white/10 bg-white/[0.03] text-arena-smoke/60"
            }`}
          >
            <span className="text-sm">⭐</span>
            <span className="text-xs font-bold font-[family-name:var(--font-display)] tracking-wide">
              {reward.cost.toLocaleString()}
            </span>
            <span className="text-[10px] text-white/30 uppercase tracking-wider">pts</span>
          </div>

          {reward.stock !== null && (
            <span className="text-[10px] text-white/30 font-[family-name:var(--font-display)] tracking-[0.15em] uppercase">
              {reward.stock} restantes
            </span>
          )}
        </div>

        {/* Cooldown */}
        {reward.cooldown && (
          <p className="text-[10px] text-white/25 mb-3 tracking-wide">⏱ Cooldown: {reward.cooldown}h</p>
        )}

        {/* ── Redeem Button — Forged Metal CTA ── */}
        <AnimatePresence mode="wait">
          {redeemed ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full py-2.5 rounded-lg bg-green-900/20 border border-green-500/20 text-center font-[family-name:var(--font-display)] text-xs text-green-400 tracking-[0.15em] uppercase"
            >
              ✓ Resgatado
            </motion.div>
          ) : (
            <motion.button
              key="redeem"
              onClick={handleRedeem}
              disabled={isLocked || !canAfford || redeeming}
              className={`armaria-forge-btn w-full py-2.5 rounded-lg font-[family-name:var(--font-display)] text-xs tracking-[0.15em] uppercase font-bold transition-all relative overflow-hidden
                ${isLocked || !canAfford
                  ? "bg-white/[0.03] border border-white/[0.06] text-white/20 cursor-not-allowed"
                  : "bg-gradient-to-b from-arena-crimson via-[#9b1212] to-[#6d0000] border border-arena-crimson/40 text-arena-white hover:from-[#a01515] hover:via-arena-crimson hover:to-[#7a0000] shadow-[0_4px_16px_rgba(139,0,0,0.25)] hover:shadow-[0_4px_20px_rgba(139,0,0,0.4)] cursor-pointer"
                }`}
              whileHover={!isLocked && canAfford ? { scale: 1.01 } : undefined}
              whileTap={!isLocked && canAfford ? { scale: 0.96 } : undefined}
            >
              {/* Ember hover glow on button */}
              {!isLocked && canAfford && (
                <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-t from-arena-ember/10 to-transparent pointer-events-none" />
              )}
              <span className="relative z-10">
                {redeeming ? "A forjar..." : !canAfford ? "Pontos insuficientes" : "Resgatar"}
              </span>
            </motion.button>
          )}
        </AnimatePresence>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-2 text-[10px] text-arena-red text-center tracking-wide"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
