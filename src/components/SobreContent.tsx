"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { STAGGER_CONTAINER, STAGGER_ITEM } from "@/lib/animations";

/* ── Arena content types ─────────────────────────────────────────── */
const ARENA_TYPES = [
  {
    icon: "🏆",
    label: "Liga dos Brutus",
    badge: "Torneio",
    desc: "Todas as semanas selecionamos jogadores de diferentes formas para competir no torneio de final do mês. Quem entra, combate.",
    variant: "gold" as const,
    href: "/liga-dos-brutus",
  },
  {
    icon: "🎰",
    label: "Bonus Hunt",
    badge: "Campanhas",
    desc: "Sempre a tentar aumentar o cardápio. Acumula-se munição, escolhe-se o momento, entra-se com força total.",
    variant: "crimson" as const,
    href: "/bonus-hunt",
  },
  {
    icon: "🌾",
    label: "Slot Farm",
    badge: "Marathons",
    desc: "Quando castigamos mesmo muito. As sessões mais longas e intensas da arena — sem pausas, sem piedade.",
    variant: "crimson" as const,
    href: null,
  },
  {
    icon: "🎮",
    label: "Slot Request",
    badge: "Tu decides",
    desc: "Fazes tu o Bonus Hunt. O chat escolhe os slots, define as apostas. A arena é de todos.",
    variant: "gold" as const,
    href: null,
  },
];

/* ── Timeline items ─────────────────────────────────────────────── */
const TIMELINE_ITEMS = [
  {
    year: "1990",
    label: "Nasce em Coimbra",
    desc: "Coimbra, Portugal. O início de tudo.",
    image: null as string | null,
  },
  {
    year: "2015",
    label: "Poker & Slots em Coimbra",
    desc: "Durante os anos na Universidade de Direito, o poker era o passatempo. As slots vieram nas pausas dos estudos — e foi aí que este mundo começou.",
    image: null as string | null,
  },
  {
    year: "2020",
    label: "Início do Streaming",
    desc: "Encontrou a Twitch pela primeira vez. Criou uma conta, pesquisou, aprendeu e lançou o canal. O que era diversão passou a ser trabalho diário.",
    image: null as string | null,
  },
  {
    year: "Hoje",
    label: "A Arena Está Aberta",
    desc: "Uma equipa, uma comunidade e um canal que cresceu com o seu criador. A arena aguarda.",
    video: "https://www.twitch.tv/brutuspolus",
    image: null as string | null,
  },
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
            className="gladiator-subtitle text-sm sm:text-base tracking-[0.28em] mb-5"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.68, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            Sem filtros · Sem encenação · Só a arena
          </motion.p>

          {/* "A História" label */}
          <motion.div
            className="flex items-center justify-center gap-4 mt-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.82, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <div className="h-px w-10 bg-arena-gold/25" />
            <span className="font-[family-name:var(--font-display)] text-arena-gold/55 text-xs tracking-[0.38em] uppercase">
              A História
            </span>
            <div className="h-px w-10 bg-arena-gold/25" />
          </motion.div>

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

              {/* First paragraph */}
              <ScrollReveal delay={0.1}>
                <p className="text-arena-white/90 text-base sm:text-lg leading-relaxed pl-5 border-l-2 border-arena-crimson/60">
                  <span className="font-[family-name:var(--font-display)] text-arena-gold">Apaixonado pelo gambling</span>{" "}
                  desde os tempos em que estudava na Universidade de Direito de Coimbra. O poker era o passatempo nas pausas dos estudos — e foi aí que as slots apareceram pela primeira vez, a jogar com os amigos. Estava descoberta a entrada para este mundo.
                </p>
              </ScrollReveal>

              {/* Second paragraph */}
              <ScrollReveal delay={0.18}>
                <p className="text-arena-smoke text-base sm:text-lg leading-relaxed pl-5 border-l border-arena-gold/20">
                  Encontrei a Twitch — era a primeira vez que entrava nesta plataforma. Criei uma conta, pesquisei artigos, vi vídeos de como configurar o canal e comecei esta aventura. Seria suficiente? Achei que não.
                </p>
              </ScrollReveal>

              {/* Third paragraph */}
              <ScrollReveal delay={0.26}>
                <p className="text-arena-smoke text-base sm:text-lg leading-relaxed pl-5 border-l border-arena-gold/20">
                  Fui evoluindo cada vez mais o canal e, comigo, foi crescendo também uma equipa que me tem ajudado a concretizar este projeto.{" "}
                  <span className="text-arena-white/80">O que era um momento de diversão, passou a ser o meu trabalho diário.</span>
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
                      { value: "1990", label: "Nascido" },
                      { value: "Coimbra", label: "Origem" },
                      { value: "2020", label: "Streaming Slots desde" },
                      { value: "100%", label: "Real e Ao Vivo" },
                    ].map((s) => (
                      <div key={s.label} className="sobre-stat-box rounded-sm">
                        <p className="font-[family-name:var(--font-ui)] text-arena-gold text-xl tracking-wider leading-none mb-1">
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
            {ARENA_TYPES.map((type) => {
              const cardContent = (
                <div className={`stone-panel${type.variant === "crimson" ? " stone-panel--crimson" : ""} rounded-sm p-6 sm:p-7 h-full arena-shine group ${type.href ? "cursor-pointer" : "cursor-default"}`}>
                  <div className="flex items-start gap-4">
                    <div className="text-2xl sm:text-3xl leading-none mt-0.5 shrink-0 group-hover:scale-110 transition-transform duration-300">
                      {type.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2.5 mb-3 flex-wrap">
                        <h3 className={`font-[family-name:var(--font-ui)] text-lg sm:text-xl tracking-[0.15em] uppercase leading-none ${
                          type.variant === "gold" ? "text-arena-gold" : "text-arena-red"
                        }`}>
                          {type.label}
                        </h3>
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
                      {type.href && (
                        <span className={`inline-block mt-3 text-xs tracking-[0.18em] uppercase font-[family-name:var(--font-ui)] ${
                          type.variant === "gold" ? "text-arena-gold/55 group-hover:text-arena-gold" : "text-arena-red/55 group-hover:text-arena-red"
                        } transition-colors duration-300`}>
                          Ver mais →
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
              return (
                <motion.div
                  key={type.label}
                  variants={STAGGER_ITEM}
                  whileHover={{ y: -5, transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] } }}
                >
                  {type.href ? (
                    <a href={type.href}>{cardContent}</a>
                  ) : (
                    cardContent
                  )}
                </motion.div>
              );
            })}
          </motion.div>

        </div>
      </section>


      {/* ═══════════════════════════════════════════════════════════
          III — A COMUNIDADE
          Community section. Crimson atmospheric glow.
          Left: quote. Right: three community feature cards with links.
          ══════════════════════════════════════════════════════════ */}
      <section className="py-20 sm:py-28 relative overflow-hidden">

        <div className="absolute inset-0 bg-gradient-to-b from-arena-black via-arena-blood/[0.07] to-arena-black pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-arena-crimson/[0.06] blur-[90px] rounded-full pointer-events-none" />

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

          <ScrollReveal>
            <SectionLabel numeral="III" label="A Comunidade" />
          </ScrollReveal>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 xl:gap-14 items-start">

            {/* Quote + copy — left */}
            <div className="lg:col-span-7">
              <ScrollReveal delay={0.1}>
                <blockquote className="font-[family-name:var(--font-display)] text-2xl sm:text-3xl lg:text-[2rem] text-arena-white/90 leading-snug mb-6">
                  "Não é apenas um canal Twitch,{" "}
                  <em className="text-arena-gold/80 not-italic">é uma família</em>{" "}
                  que partilha o gosto pelo gambling."
                </blockquote>
                <p className="text-arena-smoke/80 text-base sm:text-lg leading-relaxed max-w-lg">
                  Nas streams de Brutuspolus, ninguém está de fora. A comunidade decide, arrisca e celebra — cada spin é vivido por todos, em simultâneo, com peso real.
                </p>
              </ScrollReveal>
            </div>

            {/* Community feature cards — right */}
            <div className="lg:col-span-5 space-y-3">
              {[
                {
                  icon: "🏆",
                  title: "Leaderboard",
                  desc: "A tabela dos nossos Brutus",
                  href: "/leaderboard",
                },
                {
                  icon: "⚔",
                  title: "Bruta do Mês",
                  desc: "Onde partilhas as tuas vitórias e ganhas prémios",
                  href: "/hall-of-victories",
                },
                {
                  icon: "🎁",
                  title: "Giveaways",
                  desc: "Sorteios que decorrem na nossa live stream",
                  href: "/giveaways",
                },
              ].map((card, i) => (
                <ScrollReveal key={card.title} delay={0.1 * (i + 1)}>
                  <a href={card.href} className="block group">
                    <div className="flex gap-4 p-4 sm:p-5 rounded-sm border border-arena-gold/15 bg-arena-gold/[0.03] hover:border-arena-gold/35 hover:bg-arena-gold/[0.07] transition-all duration-300">
                      <span className="text-xl leading-none mt-0.5 shrink-0 group-hover:scale-110 transition-transform duration-300">
                        {card.icon}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-[family-name:var(--font-ui)] text-arena-gold/85 tracking-wider text-sm uppercase mb-1 group-hover:text-arena-gold transition-colors duration-300">
                          {card.title}
                        </p>
                        <p className="text-arena-smoke/65 text-sm leading-relaxed">
                          {card.desc}
                        </p>
                      </div>
                      <span className="text-arena-gold/30 group-hover:text-arena-gold/70 transition-colors duration-300 text-sm self-center shrink-0">→</span>
                    </div>
                  </a>
                </ScrollReveal>
              ))}
            </div>

          </div>
        </div>
      </section>


      {/* ═══════════════════════════════════════════════════════════
          IV — CRONOLOGIA DO BRUTUS
          Vertical timeline with year markers, images, and a video.
          ══════════════════════════════════════════════════════════ */}
      <section className="py-20 sm:py-28">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

          <ScrollReveal>
            <SectionLabel numeral="IV" label="Cronologia do Brutus" />
            <div className="mb-12 -mt-4">
              <h2 className="font-[family-name:var(--font-display)] text-arena-white/85 text-xl sm:text-2xl tracking-wide">
                A linha do tempo
              </h2>
            </div>
          </ScrollReveal>

          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-6 sm:left-8 top-0 bottom-0 w-px bg-gradient-to-b from-arena-gold/30 via-arena-gold/15 to-transparent" />

            <div className="space-y-12 sm:space-y-16">
              {TIMELINE_ITEMS.map((item, i) => (
                <ScrollReveal key={item.year} delay={0.1 * (i + 1)}>
                  <div className="flex gap-6 sm:gap-10 items-start pl-2">

                    {/* Year node */}
                    <div className="relative shrink-0 flex flex-col items-center">
                      <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-sm border border-arena-gold/30 bg-arena-gold/[0.06] flex items-center justify-center z-10">
                        <span className="font-[family-name:var(--font-ui)] text-arena-gold text-xs sm:text-sm tracking-wider leading-none text-center">
                          {item.year}
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pb-2">
                      <h3 className="font-[family-name:var(--font-ui)] text-arena-white/90 text-base sm:text-lg tracking-wider uppercase mb-2">
                        {item.label}
                      </h3>
                      <p className="text-arena-smoke/70 text-sm sm:text-base leading-relaxed mb-4">
                        {item.desc}
                      </p>

                      {/* Image slot */}
                      {item.image && (
                        <div className="relative w-full max-w-sm h-40 sm:h-52 rounded-sm overflow-hidden border border-arena-gold/15">
                          <Image
                            src={item.image}
                            alt={item.label}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}

                      {/* Video link */}
                      {"video" in item && item.video && (
                        <a
                          href={item.video}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 mt-2 px-4 py-2 rounded-sm border border-arena-gold/25 bg-arena-gold/[0.05] hover:border-arena-gold/50 hover:bg-arena-gold/[0.10] transition-all duration-300 group"
                        >
                          <span className="text-base">▶</span>
                          <span className="font-[family-name:var(--font-ui)] text-arena-gold/75 group-hover:text-arena-gold text-xs tracking-[0.18em] uppercase transition-colors duration-300">
                            Ver na Twitch
                          </span>
                        </a>
                      )}
                    </div>

                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>

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
            A arena está aberta · A família aguarda
          </p>
        </ScrollReveal>
      </section>

    </div>
  );
}
