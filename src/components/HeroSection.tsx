"use client";

import { useEffect, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import gsap from "gsap";
import { SITE_NAME } from "@/lib/constants";
import Link from "next/link";

/**
 * HERO SECTION — Full-screen cinematic entry point.
 *
 * Left-aligned content at the bottom, full-bleed gladiator image
 * with GSAP slow-zoom, rain particles, ambient glow.
 */

/* ── Snow ────────────────────────────────────────── */
function SnowField() {
  const reduceMotion = useReducedMotion();
  if (reduceMotion) return null;

  const flakes = Array.from({ length: 50 }, (_, i) => ({
    left: (i * 7.3 + (i % 5) * 6.1) % 100,
    delay: (i % 9) * 0.6,
    duration: 6 + (i % 5) * 2.5,
    size: 3 + (i % 4) * 2,
    drift: -30 + (i % 7) * 10,
    opacity: 0.3 + (i % 4) * 0.15,
  }));

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {flakes.map((flake, i) => (
        <motion.span
          key={i}
          className="absolute top-[-5%] block rounded-full bg-white"
          style={{ left: `${flake.left}%`, width: flake.size, height: flake.size }}
          animate={{ y: [0, "110vh"], x: [0, flake.drift], opacity: [0, flake.opacity, 0] }}
          transition={{ duration: flake.duration, delay: flake.delay, repeat: Infinity, ease: "linear" }}
        />
      ))}
    </div>
  );
}

/* ── Hero ────────────────────────────────────────── */
export function HeroSection() {
  const heroRef = useRef<HTMLElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const glowRef = useRef<HTMLDivElement | null>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion || !heroRef.current || !imageRef.current || !glowRef.current) return;

    const ctx = gsap.context(() => {
      gsap.to(imageRef.current, {
        scale: 1.12,
        duration: 28,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
      });

      gsap.to(glowRef.current, {
        x: 24,
        y: -16,
        opacity: 0.48,
        duration: 14,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
      });
    }, heroRef);

    return () => ctx.revert();
  }, [reduceMotion]);

  return (
    <section ref={heroRef} className="relative min-h-[100svh] overflow-hidden border-b border-white/[0.08]">
      {/* Background image layer */}
      <div className="absolute inset-0">
        <motion.img
          ref={imageRef}
          src="/images/arena-gladiator.jpg"
          alt="Gladiator standing in a stormy colosseum"
          className="h-full w-full object-cover object-[68%_50%]"
          initial={reduceMotion ? false : { scale: 1.03, opacity: 0.84 }}
          animate={reduceMotion ? { opacity: 0.96 } : { opacity: 0.96 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          fetchPriority="high"
          loading="eager"
          decoding="async"
        />

        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_32%,rgba(201,164,76,0.14),transparent_26%),radial-gradient(circle_at_78%_20%,rgba(139,0,0,0.35),transparent_26%),linear-gradient(90deg,rgba(11,11,13,0.94)_0%,rgba(11,11,13,0.72)_34%,rgba(11,11,13,0.22)_62%,rgba(11,11,13,0.9)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(11,11,13,0.28),rgba(11,11,13,0.66))]" />

        {/* Snow */}
        <SnowField />

        {/* Ambient glow orb */}
        <motion.div
          ref={glowRef}
          className="absolute right-[6%] top-[18%] h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(201,164,76,0.35)_0%,rgba(139,0,0,0.16)_46%,transparent_72%)] blur-0"
          initial={false}
          animate={reduceMotion ? { opacity: 0.24 } : { opacity: [0.18, 0.38, 0.2] }}
          transition={reduceMotion ? undefined : { duration: 12, ease: "easeInOut", repeat: Infinity }}
        />
      </div>

      {/* Content — bottom-left aligned */}
      <div className="relative z-10 flex min-h-[100svh] items-end">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 pt-28 sm:pb-20 sm:pt-32 lg:pb-24 lg:pt-36">
          <div className="max-w-3xl">
            {/* Kicker */}
            <motion.p
              className="mb-4 text-[0.72rem] font-semibold uppercase tracking-[0.36em] text-arena-gold/90"
              initial={reduceMotion ? false : { opacity: 0, y: 16 }}
              animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
            >
              {SITE_NAME}
            </motion.p>

            {/* Headline */}
            <motion.h1
              className="max-w-2xl font-[family-name:var(--font-display)] text-[clamp(3.2rem,10vw,7.8rem)] font-black uppercase leading-[0.92] tracking-[-0.05em] text-white drop-shadow-[0_8px_30px_rgba(0,0,0,0.55)]"
              initial={reduceMotion ? false : { opacity: 0, y: 22 }}
              animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: "easeOut", delay: 0.25 }}
            >
              ENTER THE ARENA
            </motion.h1>

            {/* Subline */}
            <motion.p
              className="mt-5 max-w-xl text-base leading-7 text-white/[0.76] sm:text-lg"
              initial={reduceMotion ? false : { opacity: 0, y: 18 }}
              animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: "easeOut", delay: 0.4 }}
            >
              A brutal cinematic iGaming coliseum for live slot battles, bonus hunts,
              ranked challengers, and high-conversion casino discovery.
            </motion.p>

            {/* CTA buttons */}
            <motion.div
              className="mt-8 flex flex-wrap items-center gap-4"
              initial={reduceMotion ? false : { opacity: 0, y: 20 }}
              animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: "easeOut", delay: 0.55 }}
            >
              <Link
                href="/stream"
                className="inline-flex items-center justify-center gap-2.5 rounded-full border border-arena-gold/35 bg-gradient-to-b from-arena-gold/[0.18] to-[rgba(139,0,0,0.3)] px-6 py-3.5 text-sm font-bold uppercase tracking-[0.08em] text-[#fff4d8] transition-all duration-200 hover:-translate-y-0.5 hover:border-arena-gold/65 focus-visible:outline-2 focus-visible:outline-arena-gold/80 focus-visible:outline-offset-2"
              >
                Join the Battle
              </Link>
              <Link
                href="/liga-dos-brutus"
                className="inline-flex items-center justify-center rounded-full border border-white/[0.09] bg-white/[0.03] px-5 py-3 text-sm font-semibold text-[#f4ead7]/85 transition-all duration-200 hover:-translate-y-0.5 hover:border-arena-gold/25"
              >
                Inspect the Tracker
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
