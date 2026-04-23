"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { STAGGER_CONTAINER, STAGGER_ITEM } from "@/lib/animations";

/* ── Arena content types ─────────────────────────────────────────── */
const ARENA_TYPES = [
  {
    icon: "⚔",
    label: "Combates",
    badge: "Slots",
    desc: "Cada spin é um duelo. Sem redes, sem proteção. O cilindro gira e decide quem fica de pé.",
    variant: "gold" as const,
  },
  {
    icon: "🛡",
    label: "Campanhas",
    badge: "Bonus Hunts",
    desc: "Guerras de longa distância. Acumula-se munição, escolhe-se o momento, entra-se com força total.",
    variant: "crimson" as const,
  },
  {
    icon: "👑",
    label: "Vitórias",
    badge: "Wins",
    desc: "Quando a arena sorri. Celebradas em conjunto — a Legião está sempre presente quando o campo rende.",
    variant: "gold" as const,
  },
  {
    icon: "☠",
    label: "Quedas",
    badge: "Losses",
    desc: "A arena cobra o seu preço. Mostro tudo — as quedas fazem parte de qualquer batalha honesta.",
    variant: "crimson" as const,
  },
];

/* ── Code of the Arena rules ─────────────────────────────────────── */
const CODE_ITEMS = [
  { numeral: "I",   line: "Sem filtros",     sub: "A câmara não apaga. O que acontece, fica." },
  { numeral: "II",  line: "Sem garantias",   sub: "Cada sessão pode ir para qualquer lado." },
  { numeral: "III", line: "Só jogo real",    sub: "Zero encenação. Zero edição de resultado." },
  { numeral: "IV",  line: "A Legião decide", sub: "O chat tem voz real nas batalhas." },
  { numeral: "V",   line: "Cada spin conta", sub: "Nenhum é descartado. Nenhum é esquecido." },
];

/* ── Reusable section label with ornamental line ─────────────────── */
function SectionLabel({ numeral, label }: { numeral: string; label: string }) {
  return (
    <div className="flex items-center gap-3 mb-10">
      {/* Roman numeral accent */}
      <span className="font-[family-name:var(--font-display)] text-arena-gold/40 text-xs tracking-[0.25em] uppercase shrink-0">
        {numeral}
      </span>
      <div className="h-px w-8 bg-arena-gold/20 shrink-0" />
      {/* Label */}
      <span className="font-[family-name:var(--font-ui)] text-arena-gold/70 tracking-[0.3em] text-sm uppercase shrink-0">
        {label}
      </span>
      {/* Trailing fade line */}
      <div className="h-px flex-1 bg-gradient-to-r from-arena-gold/15 to-transparent" />
    </div>
  );
}

/* ── Main component ──────────────────────────────────────────────── */
export function SobreContent() {
  return (
    <div className="min-h-screen bg-arena-black">

      {/* ═══════════════════════════════════════════════════════════
          HERO — Cinematic arena entrance
          Full-bleed arena image with layered gradients + animated title.
          Design intent: "entering the colosseum" feel, not a standard page header.
          ══════════════════════════════════════════════════════════ */}
      <section className="sobre-hero relative flex items-center justify-center pt-36 pb-28 sm:pt-44 sm:pb-36 min-h-[55vh]">

        {/* Background: colosseum arena image at low opacity */}
        <div className="absolute inset-0 overflow-hidden">
          <Image
            src="/images/pages/imgi_38_d-digital-coliseum-battlefield-background-fighting-game-concept-3d-rendering-coliseum-design-virtual-gaming-environment-battle-scenes-fighting-game-co.jpg"
            alt=""
            fill
            className="object-cover object-center"
            style={{ opacity: 0.13 }}
            priority
          />
        </div>

        {/* Gradient overlays: top/bottom fade to black, crimson bloom at top-center */}
        <div className="absolute inset-0 bg-gradient-to-b from-arena-black/85 via-arena-black/50 to-arena-black/90 pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[320px] bg-arena-crimson/10 blur-[80px] rounded-full pointer-events-none" />

        {/* Corner frame marks — Roman architectural detail */}
        <span className="absolute top-8 left-8 w-10 h-10 border-t border-l border-arena-gold/20 pointer-events-none z-10" />
        <span className="absolute top-8 right-8 w-10 h-10 border-t border-r border-arena-gold/20 pointer-events-none z-10" />
        <span className="absolute bottom-8 left-8 w-10 h-10 border-b border-l border-arena-gold/20 pointer-events-none z-10" />
        <span className="absolute bottom-8 right-8 w-10 h-10 border-b border-r border-arena-gold/20 pointer-events-none z-10" />

        {/* Hero content */}
        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">

          {/* Pre-label */}
          <motion.p
            className="font-[family-name:var(--font-ui)] text-arena-gold/55 tracking-[0.38em] text-xs sm:text-sm mb-8 uppercase"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            Brutuspolus · Streamer · Portugal
          </motion.p>

          {/* Main title — Cinzel, metallic gold gradient, large */}
          <motion.h1
            data-text="ENTRA NA ARENA"
            className="gladiator-title text-5xl sm:text-7xl md:text-8xl lg:text-9xl mb-6"
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.85, delay: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            ENTRA NA ARENA
          </motion.h1>

          {/* Diamond divider — clean decorative break */}
          <motion.div
            className="flex items-center justify-center gap-4 mb-7"
            initial={{ opacity: 0, scaleX: 0.2 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ duration: 0.7, delay: 0.55, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <div className="h-px w-20 sm:w-32 bg-gradient-to-r from-transparent via-arena-gold/30 to-arena-gold/50" />
            <div className="w-2 h-2 rotate-45 bg-arena-gold/50 shrink-0" />
            <div className="h-px w-20 sm:w-32 bg-gradient-to-l from-transparent via-arena-gold/30 to-arena-gold/50" />
          </motion.div>

          {/* Subtitle */}
          <motion.p
            className="gladiator-subtitle text-sm sm:text-base tracking-[0.28em]"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.68, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            Sem filtros · Sem encenação · Só a arena
          </motion.p>

        </div>
      </section>


      {/* ═══════════════════════════════════════════════════════════
          I — QUEM SOU
          Bio text on left (border-accented paragraphs),
          accent panel on right (quote + quick stats).
          ══════════════════════════════════════════════════════════ */}
      <section className="py-20 sm:py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

          <ScrollReveal>
            <SectionLabel numeral="I" label="Quem Sou" />
          </ScrollReveal>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 xl:gap-16 items-start">

            {/* Bio — left column */}
            <div className="lg:col-span-7 space-y-7">

              {/* First paragraph: bold left border in crimson (most important statement) */}
              <ScrollReveal delay={0.1}>
                <p className="text-arena-white/90 text-base sm:text-lg leading-relaxed pl-5 border-l-2 border-arena-crimson/60">
                  <span className="font-[family-name:var(--font-display)] text-arena-gold">Chamo-me Brutuspolus.</span>{" "}
                  Sou o gladiador português que entra na arena do casino sem rede nem proteção. Mostro tudo — as vitórias que fazem a multidão gritar e as quedas que provam que o campo de batalha não perdoa.
                </p>
              </ScrollReveal>

              {/* Second paragraph: subtler gold border */}
              <ScrollReveal delay={0.18}>
                <p className="text-arena-smoke text-base sm:text-lg leading-relaxed pl-5 border-l border-arena-gold/20">
                  Das campanhas de bonus hunt aos combates diretos com novos slots — cada sessão é um campo de batalha diferente. O chat não assiste:{" "}
                  <span className="text-arena-white/80">decide</span>. Muitas das batalhas são travadas em conjunto, e é essa voz coletiva que dá pulso à arena.
                </p>
              </ScrollReveal>

              {/* Third paragraph */}
              <ScrollReveal delay={0.26}>
                <p className="text-arena-smoke text-base sm:text-lg leading-relaxed pl-5 border-l border-arena-gold/20">
                  Isto não é entretenimento. É a{" "}
                  <span className="text-arena-white/80">experiência completa</span>{" "}
                  da arena — onde cada spin tem peso real, cada decisão tem consequência, e quem está do outro lado vive tudo comigo, em tempo real, sem cortes.
                </p>
              </ScrollReveal>

            </div>

            {/* Accent panel — right column
                Styled as a carved stone tablet with a quote and key facts. */}
            <div className="lg:col-span-5">
              <ScrollReveal delay={0.2}>
                <div className="stone-panel rounded-sm p-7 sm:p-9 arena-shine">

                  {/* Panel header ornament */}
                  <div className="flex items-center gap-3 mb-7">
                    <div className="h-px flex-1 bg-arena-gold/20" />
                    <span className="font-[family-name:var(--font-display)] text-arena-gold/35 text-xs tracking-[0.32em] uppercase">
                      Arena
                    </span>
                    <div className="h-px flex-1 bg-arena-gold/20" />
                  </div>

                  {/* Signature quote */}
                  <blockquote className="font-[family-name:var(--font-display)] text-arena-gold/75 text-base sm:text-lg leading-relaxed italic text-center mb-7">
                    "Aqui não há histórias bonitas.<br />
                    Só a verdade do jogo."
                  </blockquote>

                  {/* Thin divider */}
                  <div className="flex items-center gap-3 mb-6">
                    <div className="h-px flex-1 bg-arena-gold/10" />
                    <div className="w-1 h-1 rotate-45 bg-arena-gold/30 shrink-0" />
                    <div className="h-px flex-1 bg-arena-gold/10" />
                  </div>

                  {/* Quick-fact grid */}
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { value: "500+", label: "Slots Testados" },
                      { value: "Chat", label: "Decide Tudo" },
                      { value: "100%", label: "Real e Ao Vivo" },
                      { value: "Zero", label: "Filtros" },
                    ].map((s) => (
                      <div key={s.label} className="sobre-stat-box rounded-sm">
                        <p className="font-[family-name:var(--font-ui)] text-arena-gold text-2xl tracking-wider leading-none mb-1">
                          {s.value}
                        </p>
                        <p className="font-[family-name:var(--font-display)] text-arena-smoke/55 text-xs tracking-widest uppercase">
                          {s.label}
                        </p>
                      </div>
                    ))}
                  </div>

                </div>
              </ScrollReveal>
            </div>

          </div>
        </div>
      </section>


      {/* ═══════════════════════════════════════════════════════════
          II — A ARENA
          Four content-type cards in a 2×2 grid.
          Gold cards = wins/slots; Crimson = losses/bonus hunts.
          Hover lifts the card (handled in Framer to avoid CSS conflict).
          ══════════════════════════════════════════════════════════ */}
      <section className="py-20 sm:py-28 relative">

        {/* Depth gradient — separates this section visually */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-arena-iron/20 to-transparent pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

          <ScrollReveal>
            <SectionLabel numeral="II" label="A Arena" />
            <div className="mb-10 -mt-4">
              <h2 className="font-[family-name:var(--font-display)] text-arena-white/85 text-xl sm:text-2xl tracking-wide mb-2">
                O que acontece na arena
              </h2>
              <p className="text-arena-smoke/70 text-sm sm:text-base">
                Cada sessão tem o seu propósito. Cada batalha, o seu nome.
              </p>
            </div>
          </ScrollReveal>

          <motion.div
            variants={STAGGER_CONTAINER}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-60px" }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5"
          >
            {ARENA_TYPES.map((type) => (
              /* Framer handles the lift on hover — CSS transform would conflict */
              <motion.div
                key={type.label}
                variants={STAGGER_ITEM}
                whileHover={{ y: -5, transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] } }}
              >
                <div className={`stone-panel${type.variant === "crimson" ? " stone-panel--crimson" : ""} rounded-sm p-6 sm:p-7 h-full arena-shine group cursor-default`}>
                  <div className="flex items-start gap-4">

                    {/* Icon — scales up on group-hover */}
                    <div className="text-2xl sm:text-3xl leading-none mt-0.5 shrink-0 group-hover:scale-110 transition-transform duration-300">
                      {type.icon}
                    </div>

                    {/* Card body */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2.5 mb-3 flex-wrap">
                        <h3 className={`font-[family-name:var(--font-ui)] text-lg sm:text-xl tracking-[0.15em] uppercase leading-none ${
                          type.variant === "gold" ? "text-arena-gold" : "text-arena-red"
                        }`}>
                          {type.label}
                        </h3>
                        {/* Original-name badge — subtle engraved tag */}
                        <span className={`font-[family-name:var(--font-display)] text-xs px-2 py-0.5 border tracking-wider rounded-sm leading-none ${
                          type.variant === "gold"
                            ? "border-arena-gold/20 text-arena-gold/40 bg-arena-gold/5"
                            : "border-arena-crimson/20 text-arena-red/40 bg-arena-crimson/5"
                        }`}>
                          {type.badge}
                        </span>
                      </div>
                      <p className="text-arena-smoke/80 text-sm sm:text-base leading-relaxed">
                        {type.desc}
                      </p>
                    </div>

                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

        </div>
      </section>


      {/* ═══════════════════════════════════════════════════════════
          III — A LEGIÃO
          Community section. Crimson atmospheric glow.
          Left: powerful quote + copy. Right: three community pillars.
          ══════════════════════════════════════════════════════════ */}
      <section className="py-20 sm:py-28 relative overflow-hidden">

        {/* Atmospheric tint — subtle crimson field rising from center */}
        <div className="absolute inset-0 bg-gradient-to-b from-arena-black via-arena-blood/[0.07] to-arena-black pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-arena-crimson/[0.06] blur-[90px] rounded-full pointer-events-none" />

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

          <ScrollReveal>
            <SectionLabel numeral="III" label="A Legião" />
          </ScrollReveal>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 xl:gap-14 items-start">

            {/* Quote + copy — left */}
            <div className="lg:col-span-7">
              <ScrollReveal delay={0.1}>
                <blockquote className="font-[family-name:var(--font-display)] text-2xl sm:text-3xl lg:text-[2rem] text-arena-white/90 leading-snug mb-6">
                  "O chat não é audiência.{" "}
                  <em className="text-arena-red/80 not-italic">É a legião</em>{" "}
                  que combate ao meu lado."
                </blockquote>
                <p className="text-arena-smoke/80 text-base sm:text-lg leading-relaxed max-w-lg">
                  Nas streams de Brutuspolus, ninguém está de fora. A comunidade decide, arrisca e celebra — cada spin é vivido por todos, em simultâneo, com peso real.
                </p>
              </ScrollReveal>
            </div>

            {/* Three pillars — right */}
            <div className="lg:col-span-5 space-y-3">
              {[
                {
                  icon: "⚔",
                  title: "Decisões em conjunto",
                  desc: "O chat define as batalhas — que slot entrar, quanto apostar, quando parar.",
                },
                {
                  icon: "🔴",
                  title: "Ao vivo, sem cortes",
                  desc: "Nada é editado. A arena mostra tudo — vitórias e derrotas em tempo real.",
                },
                {
                  icon: "🏛",
                  title: "Pertences à legião",
                  desc: "Aqui não há espectadores passivos. Só guerreiros que sentem cada combate.",
                },
              ].map((pillar, i) => (
                <ScrollReveal key={pillar.title} delay={0.1 * (i + 1)}>
                  <div className="flex gap-4 p-4 sm:p-5 rounded-sm border border-arena-crimson/15 bg-arena-crimson/[0.04] hover:border-arena-crimson/30 hover:bg-arena-crimson/[0.07] transition-all duration-300 group">
                    <span className="text-xl leading-none mt-0.5 shrink-0 group-hover:scale-110 transition-transform duration-300">
                      {pillar.icon}
                    </span>
                    <div>
                      <p className="font-[family-name:var(--font-ui)] text-arena-white/85 tracking-wider text-sm uppercase mb-1 group-hover:text-arena-white transition-colors duration-300">
                        {pillar.title}
                      </p>
                      <p className="text-arena-smoke/65 text-sm leading-relaxed">
                        {pillar.desc}
                      </p>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>

          </div>
        </div>
      </section>


      {/* ═══════════════════════════════════════════════════════════
          IV — CÓDIGO DA ARENA
          Numbered rules styled as engraved stone edicts.
          Each item slides right on hover, numeral glows gold.
          ══════════════════════════════════════════════════════════ */}
      <section className="py-20 sm:py-28">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">

          <ScrollReveal>
            <SectionLabel numeral="IV" label="Código da Arena" />
            <div className="mb-10 -mt-4">
              <h2 className="font-[family-name:var(--font-display)] text-arena-white/85 text-xl sm:text-2xl tracking-wide">
                As leis que regem cada batalha
              </h2>
            </div>
          </ScrollReveal>

          <motion.div
            variants={STAGGER_CONTAINER}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-40px" }}
            className="space-y-2"
          >
            {CODE_ITEMS.map((item) => (
              <motion.div key={item.numeral} variants={STAGGER_ITEM}>
                {/* CSS handles the translateX slide (no Framer conflict since no y/scale motion here) */}
                <div className="arena-code-item rounded-sm group">

                  {/* Roman numeral — faint, glows on hover */}
                  <span className="font-[family-name:var(--font-display)] text-arena-gold/30 text-xs tracking-[0.22em] w-8 shrink-0 group-hover:text-arena-gold/65 transition-colors duration-300">
                    {item.numeral}
                  </span>

                  {/* Vertical separator line */}
                  <div className="w-px h-9 bg-arena-gold/12 shrink-0 group-hover:bg-arena-gold/35 transition-colors duration-300" />

                  {/* Rule text */}
                  <div className="flex-1 min-w-0">
                    <p className="font-[family-name:var(--font-ui)] text-arena-white/90 text-lg sm:text-xl tracking-wider uppercase group-hover:text-arena-gold transition-colors duration-300 leading-tight">
                      {item.line}
                    </p>
                    <p className="text-arena-smoke/55 text-xs sm:text-sm mt-0.5 leading-relaxed">
                      {item.sub}
                    </p>
                  </div>

                </div>
              </motion.div>
            ))}
          </motion.div>

        </div>
      </section>


      {/* ── Closing ornament ─────────────────────────────────────── */}
      <section className="pb-20 pt-2 text-center">
        <ScrollReveal>
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-arena-gold/25" />
            <div className="w-1.5 h-1.5 rotate-45 bg-arena-gold/35" />
            <div className="w-px h-3 bg-arena-gold/25" />
            <div className="w-1.5 h-1.5 rotate-45 bg-arena-gold/35" />
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-arena-gold/25" />
          </div>
          <p className="font-[family-name:var(--font-display)] text-arena-smoke/40 text-xs tracking-[0.28em] uppercase">
            A arena está aberta · A legião aguarda
          </p>
        </ScrollReveal>
      </section>

    </div>
  );
}
