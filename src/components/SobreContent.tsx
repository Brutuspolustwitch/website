"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { STAGGER_CONTAINER, STAGGER_ITEM } from "@/lib/animations";
import { useEffect, useState } from "react";

/* ── Content types ───────────────────────────────────────── */
interface ArenaType {
  icon: string; label: string; badge: string; desc: string;
  variant: "gold" | "crimson"; href: string | null;
}
interface TimelineItem {
  id: string; year: string; label: string; desc: string;
  image?: string | null; video?: string | null;
  accent?: "gold" | "crimson" | "none";
}
interface Stat { value: string; label: string; }
interface CommunityCard { icon: string; title: string; desc: string; href: string; }
interface SobreData {
  hero: {
    prelabel: string; title: string; subtitle: string; history_label: string;
    layout: "centered" | "split";
    bg_image?: string | null;
  };
  bio: {
    p1_bold: string; p1: string; p2: string; p3: string; p3_highlight: string; quote: string; stats: Stat[];
    layout: "sidebar" | "fullwidth";
  };
  arena: {
    section_title: string; section_desc: string; types: ArenaType[];
    layout: "grid" | "list";
  };
  community: {
    blockquote_line1: string; blockquote_emphasis: string; blockquote_line2: string; desc: string; cards: CommunityCard[];
    layout: "split" | "centered";
  };
  timeline: {
    section_title: string; items: TimelineItem[];
    layout: "left-line" | "alternating" | "compact";
  };
  closing: { text: string; };
}

/* ── Hardcoded defaults ───────────────────────────────────── */
const DEFAULTS: SobreData = {
  hero: {
    prelabel: "Brutuspolus · Streamer · Portugal",
    title: "ENTRA NA ARENA",
    subtitle: "Sem filtros · Sem encenação · Só a arena",
    history_label: "A História",
    layout: "centered",
    bg_image: null,
  },
  bio: {
    p1_bold: "Apaixonado pelo gambling",
    layout: "sidebar",
    p1: "desde os tempos em que estudava na Universidade de Direito de Coimbra. O poker era o passatempo nas pausas dos estudos — e foi aí que as slots apareceram pela primeira vez, a jogar com os amigos. Estava descoberta a entrada para este mundo.",
    p2: "Encontrei a Twitch — era a primeira vez que entrava nesta plataforma. Criei uma conta, pesquisei artigos, vi vídeos de como configurar o canal e comecei esta aventura. Seria suficiente? Achei que não.",
    p3: "Fui evoluindo cada vez mais o canal e, comigo, foi crescendo também uma equipa que me tem ajudado a concretizar este projeto.",
    p3_highlight: "O que era um momento de diversão, passou a ser o meu trabalho diário.",
    quote: "Aqui não há histórias bonitas.\nSó a verdade do jogo.",
    stats: [
      { value: "1990", label: "Nascido" },
      { value: "Coimbra", label: "Origem" },
      { value: "2020", label: "Streaming Slots desde" },
      { value: "100%", label: "Real e Ao Vivo" },
    ],
  },
  arena: {
    section_title: "O que acontece na arena",
    section_desc: "Cada sessão tem o seu propósito. Cada batalha, o seu nome.",
    layout: "grid",
    types: [
      { icon: "🏆", label: "Liga dos Brutus", badge: "Torneio", desc: "Todas as semanas selecionamos jogadores de diferentes formas para competir no torneio de final do mês. Quem entra, combate.", variant: "gold", href: "/liga-dos-brutus" },
      { icon: "🎰", label: "Bonus Hunt", badge: "Campanhas", desc: "Sempre a tentar aumentar o cardápio. Acumula-se munição, escolhe-se o momento, entra-se com força total.", variant: "crimson", href: "/bonus-hunt" },
      { icon: "🌾", label: "Slot Farm", badge: "Marathons", desc: "Quando castigamos mesmo muito. As sessões mais longas e intensas da arena — sem pausas, sem piedade.", variant: "crimson", href: null },
      { icon: "🎮", label: "Slot Request", badge: "Tu decides", desc: "Fazes tu o Bonus Hunt. O chat escolhe os slots, define as apostas. A arena é de todos.", variant: "gold", href: null },
    ],
  },
  community: {
    blockquote_line1: "Não é apenas um canal Twitch,",
    blockquote_emphasis: "é uma família",
    blockquote_line2: "que partilha o gosto pelo gambling.",
    desc: "Nas streams de Brutuspolus, ninguém está de fora. A comunidade decide, arrisca e celebra — cada spin é vivido por todos, em simultâneo, com peso real.",
    layout: "split",
    cards: [
      { icon: "🏆", title: "Leaderboard", desc: "A tabela dos nossos Brutus", href: "/leaderboard" },
      { icon: "⚔", title: "Bruta do Mês", desc: "Onde partilhas as tuas vitórias e ganhas prémios", href: "/hall-of-victories" },
      { icon: "🎁", title: "Giveaways", desc: "Sorteios que decorrem na nossa live stream", href: "/giveaways" },
    ],
  },
  timeline: {
    section_title: "A linha do tempo",
    layout: "left-line",
    items: [
      { id: "1", year: "1990", label: "Nasce em Coimbra", desc: "Coimbra, Portugal. O início de tudo.", image: null, video: null, accent: "gold" },
      { id: "2", year: "2015", label: "Poker & Slots em Coimbra", desc: "Durante os anos na Universidade de Direito, o poker era o passatempo. As slots vieram nas pausas dos estudos — e foi aí que este mundo começou.", image: null, video: null, accent: "none" },
      { id: "3", year: "2020", label: "Início do Streaming", desc: "Encontrou a Twitch pela primeira vez. Criou uma conta, pesquisou, aprendeu e lançou o canal. O que era diversão passou a ser trabalho diário.", image: null, video: null, accent: "crimson" },
      { id: "4", year: "Hoje", label: "A Arena Está Aberta", desc: "Uma equipa, uma comunidade e um canal que cresceu com o seu criador. A arena aguarda.", image: null, video: "https://www.twitch.tv/brutuspolus", accent: "gold" },
    ],
  },
  closing: { text: "A arena está aberta · A família aguarda" },
};

function deepMerge<T>(defaults: T, override: Partial<T> | null | undefined): T {
  if (!override) return defaults;
  const result = { ...defaults };
  for (const key in override) {
    const k = key as keyof T;
    const ov = override[k];
    const dv = defaults[k];
    if (ov !== null && ov !== undefined && typeof ov === "object" && !Array.isArray(ov) && typeof dv === "object" && !Array.isArray(dv)) {
      result[k] = deepMerge(dv as object, ov as object) as T[keyof T];
    } else if (ov !== undefined) {
      result[k] = ov as T[keyof T];
    }
  }
  return result;
}

/* ── Twitch embed helper ─────────────────────────────────────────── */
function buildTwitchEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    const parent = typeof window !== "undefined" ? window.location.hostname : "www.brutuspolus.com";
    const p = `parent=${encodeURIComponent(parent)}&autoplay=false`;

    // clips.twitch.tv/ClipSlug
    if (u.hostname === "clips.twitch.tv") {
      const slug = u.pathname.replace(/^\//, "").split("/")[0];
      return `https://clips.twitch.tv/embed?clip=${slug}&${p}`;
    }
    // twitch.tv/channel/clip/ClipSlug
    const clipMatch = u.pathname.match(/\/[^/]+\/clip\/([^/?]+)/);
    if (clipMatch) return `https://clips.twitch.tv/embed?clip=${clipMatch[1]}&${p}`;
    // twitch.tv/videos/12345
    const vodMatch = u.pathname.match(/\/videos\/(\d+)/);
    if (vodMatch) return `https://player.twitch.tv/?video=${vodMatch[1]}&${p}`;
    // twitch.tv/channel
    const chanMatch = u.pathname.match(/^\/([A-Za-z0-9_]+)\/?$/);
    if (chanMatch && u.hostname.includes("twitch.tv")) return `https://player.twitch.tv/?channel=${chanMatch[1]}&${p}`;
    return null;
  } catch { return null; }
}

function TwitchEmbed({ url, label }: { url: string; label: string }) {
  const [active, setActive] = useState(false);
  const embedUrl = buildTwitchEmbedUrl(url);

  if (!embedUrl) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer"
        className="inline-flex items-center gap-2 mt-2 px-4 py-2 rounded-sm border border-arena-gold/25 bg-arena-gold/[0.05] hover:border-arena-gold/50 hover:bg-arena-gold/[0.10] transition-all duration-300 group">
        <span className="text-base">▶</span>
        <span className="font-[family-name:var(--font-ui)] text-arena-gold/75 group-hover:text-arena-gold text-xs tracking-[0.18em] uppercase transition-colors duration-300">Ver na Twitch</span>
      </a>
    );
  }

  return (
    <div className="mt-3 w-full max-w-lg">
      {active ? (
        <div className="relative w-full rounded-sm overflow-hidden border border-arena-gold/20"
          style={{ paddingBottom: "56.25%" }}>
          <iframe
            src={embedUrl}
            title={label}
            allowFullScreen
            className="absolute inset-0 w-full h-full"
            style={{ border: "none" }}
          />
        </div>
      ) : (
        <button
          onClick={() => setActive(true)}
          className="relative w-full rounded-sm overflow-hidden border border-arena-gold/20 bg-black/40 group transition-all hover:border-arena-gold/50"
          style={{ paddingBottom: "56.25%" }}
          aria-label={`Reproduzir: ${label}`}
        >
          {/* purple Twitch-ish gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#1a0a2e] to-[#0d1117]" />
          {/* Twitch logo watermark */}
          <svg className="absolute top-3 left-3 w-6 h-6 opacity-30" viewBox="0 0 24 24" fill="#9146ff">
            <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z"/>
          </svg>
          {/* play button */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-14 h-14 rounded-full bg-[#9146ff]/80 group-hover:bg-[#9146ff] flex items-center justify-center transition-all group-hover:scale-110 shadow-lg"
              style={{ boxShadow: "0 0 20px rgba(145,70,255,0.4)" }}>
              <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </div>
          </div>
          <span className="absolute bottom-3 left-0 right-0 text-center font-[family-name:var(--font-ui)] text-arena-white/60 text-xs tracking-[0.18em] uppercase">
            Ver na Twitch
          </span>
        </button>
      )}
    </div>
  );
}

/* ── Reusable section label with ornamental line ─────────────────── */
function SectionLabel({ numeral, label }: { numeral: string; label: string }) {
  return (
    <div className="flex items-center gap-3 mb-10">
      <span className="font-[family-name:var(--font-display)] text-arena-gold/40 text-xs tracking-[0.25em] uppercase shrink-0">
        {numeral}
      </span>
      <div className="h-px w-8 bg-arena-gold/20 shrink-0" />
      <span className="font-[family-name:var(--font-ui)] text-arena-gold/70 tracking-[0.3em] text-sm uppercase shrink-0">
        {label}
      </span>
      <div className="h-px flex-1 bg-gradient-to-r from-arena-gold/15 to-transparent" />
    </div>
  );
}

/* ── Main component ──────────────────────────────────────────────── */
export function SobreContent() {
  const [c, setC] = useState<SobreData>(DEFAULTS);

  useEffect(() => {
    fetch("/api/sobre-content")
      .then((r) => r.json())
      .then(({ data }) => { if (data) setC(deepMerge(DEFAULTS, data)); })
      .catch(() => {/* keep defaults */});
  }, []);

  return (
    <div className="bg-arena-black">

      {/* ═══════════════════════════════════════════════════════════
          HERO — layout: "centered" | "split"
          ══════════════════════════════════════════════════════════ */}
      <section className="sobre-hero relative flex items-center justify-center pt-36 pb-28 sm:pt-44 sm:pb-36 min-h-[55vh]">

        {/* Background image */}
        <div className="absolute inset-0 overflow-hidden">
          <Image
            src={c.hero.bg_image || "/images/pages/imgi_38_d-digital-coliseum-battlefield-background-fighting-game-concept-3d-rendering-coliseum-design-virtual-gaming-environment-battle-scenes-fighting-game-co.jpg"}
            alt=""
            fill
            className="object-cover object-center"
            style={{ opacity: 0.13 }}
            priority
          />
        </div>

        <div className="absolute inset-0 bg-gradient-to-b from-arena-black/85 via-arena-black/50 to-arena-black/90 pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[320px] bg-arena-crimson/10 blur-[80px] rounded-full pointer-events-none" />

        <span className="absolute top-8 left-8 w-10 h-10 border-t border-l border-arena-gold/20 pointer-events-none z-10" />
        <span className="absolute top-8 right-8 w-10 h-10 border-t border-r border-arena-gold/20 pointer-events-none z-10" />
        <span className="absolute bottom-8 left-8 w-10 h-10 border-b border-l border-arena-gold/20 pointer-events-none z-10" />
        <span className="absolute bottom-8 right-8 w-10 h-10 border-b border-r border-arena-gold/20 pointer-events-none z-10" />

        {c.hero.layout === "split" ? (
          /* SPLIT — text left, big title right */
          <div className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-8 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div>
              <motion.p
                className="font-[family-name:var(--font-ui)] text-arena-gold/55 tracking-[0.38em] text-xs sm:text-sm mb-6 uppercase"
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
              >{c.hero.prelabel}</motion.p>
              <motion.p
                className="gladiator-subtitle text-sm sm:text-base tracking-[0.28em] mb-6"
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
              >{c.hero.subtitle}</motion.p>
              <motion.div
                className="flex items-center gap-4"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.6 }}
              >
                <div className="h-px w-10 bg-arena-gold/25" />
                <span className="font-[family-name:var(--font-display)] text-arena-gold/55 text-xs tracking-[0.38em] uppercase">{c.hero.history_label}</span>
                <div className="h-px w-10 bg-arena-gold/25" />
              </motion.div>
            </div>
            <div className="text-right lg:text-right">
              <motion.h1
                data-text={c.hero.title}
                className="gladiator-title text-5xl sm:text-6xl md:text-7xl lg:text-8xl"
                initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.85, delay: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
              >{c.hero.title}</motion.h1>
            </div>
          </div>
        ) : (
          /* CENTERED (default) */
          <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
            <motion.p
              className="font-[family-name:var(--font-ui)] text-arena-gold/55 tracking-[0.38em] text-xs sm:text-sm mb-8 uppercase"
              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
            >{c.hero.prelabel}</motion.p>

            <motion.h1
              data-text={c.hero.title}
              className="gladiator-title text-5xl sm:text-7xl md:text-8xl lg:text-9xl mb-6"
              initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.85, delay: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
            >{c.hero.title}</motion.h1>

            <motion.div
              className="flex items-center justify-center gap-4 mb-7"
              initial={{ opacity: 0, scaleX: 0.2 }} animate={{ opacity: 1, scaleX: 1 }}
              transition={{ duration: 0.7, delay: 0.55, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <div className="h-px w-20 sm:w-32 bg-gradient-to-r from-transparent via-arena-gold/30 to-arena-gold/50" />
              <div className="w-2 h-2 rotate-45 bg-arena-gold/50 shrink-0" />
              <div className="h-px w-20 sm:w-32 bg-gradient-to-l from-transparent via-arena-gold/30 to-arena-gold/50" />
            </motion.div>

            <motion.p
              className="gladiator-subtitle text-sm sm:text-base tracking-[0.28em] mb-5"
              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.68, ease: [0.25, 0.46, 0.45, 0.94] }}
            >{c.hero.subtitle}</motion.p>

            <motion.div
              className="flex items-center justify-center gap-4 mt-4"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.82, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <div className="h-px w-10 bg-arena-gold/25" />
              <span className="font-[family-name:var(--font-display)] text-arena-gold/55 text-xs tracking-[0.38em] uppercase">{c.hero.history_label}</span>
              <div className="h-px w-10 bg-arena-gold/25" />
            </motion.div>
          </div>
        )}
      </section>


      {/* ═══════════════════════════════════════════════════════════
          I — QUEM SOU — layout: "sidebar" | "fullwidth"
          ══════════════════════════════════════════════════════════ */}
      <section className="py-20 sm:py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

          <ScrollReveal>
            <SectionLabel numeral="I" label="Quem Sou" />
          </ScrollReveal>

          {c.bio.layout === "fullwidth" ? (
            /* FULLWIDTH — wide text, no sidebar */
            <div className="max-w-3xl space-y-7">
              <ScrollReveal delay={0.1}>
                <p className="text-arena-white/90 text-base sm:text-lg leading-relaxed pl-5 border-l-2 border-arena-crimson/60">
                  <span className="font-[family-name:var(--font-display)] text-arena-gold">{c.bio.p1_bold}</span>{" "}{c.bio.p1}
                </p>
              </ScrollReveal>
              <ScrollReveal delay={0.18}>
                <p className="text-arena-smoke text-base sm:text-lg leading-relaxed pl-5 border-l border-arena-gold/20">{c.bio.p2}</p>
              </ScrollReveal>
              <ScrollReveal delay={0.26}>
                <p className="text-arena-smoke text-base sm:text-lg leading-relaxed pl-5 border-l border-arena-gold/20">
                  {c.bio.p3}{" "}<span className="text-arena-white/80">{c.bio.p3_highlight}</span>
                </p>
              </ScrollReveal>
              <ScrollReveal delay={0.34}>
                <blockquote className="font-[family-name:var(--font-display)] text-arena-gold/75 text-base sm:text-lg leading-relaxed italic border-l-2 border-arena-gold/30 pl-5 py-1">
                  {c.bio.quote.split("\n").map((line, i, arr) => (
                    <span key={i}>{line}{i < arr.length - 1 && <br />}</span>
                  ))}
                </blockquote>
              </ScrollReveal>
              <ScrollReveal delay={0.42}>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  {c.bio.stats.map((s) => (
                    <div key={s.label} className="sobre-stat-box rounded-sm">
                      <p className="font-[family-name:var(--font-ui)] text-arena-gold text-xl tracking-wider leading-none mb-1">{s.value}</p>
                      <p className="font-[family-name:var(--font-display)] text-arena-smoke/55 text-xs tracking-widest uppercase">{s.label}</p>
                    </div>
                  ))}
                </div>
              </ScrollReveal>
            </div>
          ) : (
            /* SIDEBAR (default) */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 xl:gap-16 items-start">
              <div className="lg:col-span-7 space-y-7">
                <ScrollReveal delay={0.1}>
                  <p className="text-arena-white/90 text-base sm:text-lg leading-relaxed pl-5 border-l-2 border-arena-crimson/60">
                    <span className="font-[family-name:var(--font-display)] text-arena-gold">{c.bio.p1_bold}</span>{" "}{c.bio.p1}
                  </p>
                </ScrollReveal>
                <ScrollReveal delay={0.18}>
                  <p className="text-arena-smoke text-base sm:text-lg leading-relaxed pl-5 border-l border-arena-gold/20">{c.bio.p2}</p>
                </ScrollReveal>
                <ScrollReveal delay={0.26}>
                  <p className="text-arena-smoke text-base sm:text-lg leading-relaxed pl-5 border-l border-arena-gold/20">
                    {c.bio.p3}{" "}<span className="text-arena-white/80">{c.bio.p3_highlight}</span>
                  </p>
                </ScrollReveal>
              </div>
              <div className="lg:col-span-5">
                <ScrollReveal delay={0.2}>
                  <div className="stone-panel rounded-sm p-7 sm:p-9 arena-shine">
                    <div className="flex items-center gap-3 mb-7">
                      <div className="h-px flex-1 bg-arena-gold/20" />
                      <span className="font-[family-name:var(--font-display)] text-arena-gold/35 text-xs tracking-[0.32em] uppercase">Arena</span>
                      <div className="h-px flex-1 bg-arena-gold/20" />
                    </div>
                    <blockquote className="font-[family-name:var(--font-display)] text-arena-gold/75 text-base sm:text-lg leading-relaxed italic text-center mb-7">
                      {c.bio.quote.split("\n").map((line, i, arr) => (
                        <span key={i}>{line}{i < arr.length - 1 && <br />}</span>
                      ))}
                    </blockquote>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="h-px flex-1 bg-arena-gold/10" />
                      <div className="w-1 h-1 rotate-45 bg-arena-gold/30 shrink-0" />
                      <div className="h-px flex-1 bg-arena-gold/10" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {c.bio.stats.map((s) => (
                        <div key={s.label} className="sobre-stat-box rounded-sm">
                          <p className="font-[family-name:var(--font-ui)] text-arena-gold text-xl tracking-wider leading-none mb-1">{s.value}</p>
                          <p className="font-[family-name:var(--font-display)] text-arena-smoke/55 text-xs tracking-widest uppercase">{s.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </ScrollReveal>
              </div>
            </div>
          )}
        </div>
      </section>


      {/* ═══════════════════════════════════════════════════════════
          II — A ARENA — layout: "grid" | "list"
          ══════════════════════════════════════════════════════════ */}
      <section className="py-20 sm:py-28 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-arena-iron/20 to-transparent pointer-events-none" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <SectionLabel numeral="II" label="A Arena" />
            <div className="mb-10 -mt-4">
              <h2 className="font-[family-name:var(--font-display)] text-arena-white/85 text-xl sm:text-2xl tracking-wide mb-2">{c.arena.section_title}</h2>
              <p className="text-arena-smoke/70 text-sm sm:text-base">{c.arena.section_desc}</p>
            </div>
          </ScrollReveal>

          {c.arena.layout === "list" ? (
            /* LIST — stacked full-width rows */
            <motion.div variants={STAGGER_CONTAINER} initial="initial" whileInView="animate" viewport={{ once: true, margin: "-60px" }} className="space-y-3">
              {c.arena.types.map((type) => {
                const inner = (
                  <div className={`stone-panel${type.variant === "crimson" ? " stone-panel--crimson" : ""} rounded-sm px-6 py-5 arena-shine group ${type.href ? "cursor-pointer" : "cursor-default"} flex items-center gap-5`}>
                    <div className="text-2xl leading-none shrink-0 group-hover:scale-110 transition-transform duration-300">{type.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2.5 mb-1 flex-wrap">
                        <h3 className={`font-[family-name:var(--font-ui)] text-base sm:text-lg tracking-[0.15em] uppercase leading-none ${type.variant === "gold" ? "text-arena-gold" : "text-arena-red"}`}>{type.label}</h3>
                        <span className={`font-[family-name:var(--font-display)] text-xs px-2 py-0.5 border tracking-wider rounded-sm leading-none ${type.variant === "gold" ? "border-arena-gold/20 text-arena-gold/40 bg-arena-gold/5" : "border-arena-crimson/20 text-arena-red/40 bg-arena-crimson/5"}`}>{type.badge}</span>
                      </div>
                      <p className="text-arena-smoke/80 text-sm leading-relaxed">{type.desc}</p>
                    </div>
                    {type.href && <span className={`text-sm shrink-0 ${type.variant === "gold" ? "text-arena-gold/55 group-hover:text-arena-gold" : "text-arena-red/55 group-hover:text-arena-red"} transition-colors duration-300`}>→</span>}
                  </div>
                );
                return (
                  <motion.div key={type.label} variants={STAGGER_ITEM} whileHover={{ x: 4, transition: { duration: 0.2 } }}>
                    {type.href ? <a href={type.href}>{inner}</a> : inner}
                  </motion.div>
                );
              })}
            </motion.div>
          ) : (
            /* GRID 2×2 (default) */
            <motion.div variants={STAGGER_CONTAINER} initial="initial" whileInView="animate" viewport={{ once: true, margin: "-60px" }} className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              {c.arena.types.map((type) => {
                const cardContent = (
                  <div className={`stone-panel${type.variant === "crimson" ? " stone-panel--crimson" : ""} rounded-sm p-6 sm:p-7 h-full arena-shine group ${type.href ? "cursor-pointer" : "cursor-default"}`}>
                    <div className="flex items-start gap-4">
                      <div className="text-2xl sm:text-3xl leading-none mt-0.5 shrink-0 group-hover:scale-110 transition-transform duration-300">{type.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2.5 mb-3 flex-wrap">
                          <h3 className={`font-[family-name:var(--font-ui)] text-lg sm:text-xl tracking-[0.15em] uppercase leading-none ${type.variant === "gold" ? "text-arena-gold" : "text-arena-red"}`}>{type.label}</h3>
                          <span className={`font-[family-name:var(--font-display)] text-xs px-2 py-0.5 border tracking-wider rounded-sm leading-none ${type.variant === "gold" ? "border-arena-gold/20 text-arena-gold/40 bg-arena-gold/5" : "border-arena-crimson/20 text-arena-red/40 bg-arena-crimson/5"}`}>{type.badge}</span>
                        </div>
                        <p className="text-arena-smoke/80 text-sm sm:text-base leading-relaxed">{type.desc}</p>
                        {type.href && (
                          <span className={`inline-block mt-3 text-xs tracking-[0.18em] uppercase font-[family-name:var(--font-ui)] ${type.variant === "gold" ? "text-arena-gold/55 group-hover:text-arena-gold" : "text-arena-red/55 group-hover:text-arena-red"} transition-colors duration-300`}>Ver mais →</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
                return (
                  <motion.div key={type.label} variants={STAGGER_ITEM} whileHover={{ y: -5, transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] } }}>
                    {type.href ? <a href={type.href}>{cardContent}</a> : cardContent}
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </div>
      </section>


      {/* ═══════════════════════════════════════════════════════════
          III — A COMUNIDADE — layout: "split" | "centered"
          ══════════════════════════════════════════════════════════ */}
      <section className="py-20 sm:py-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-arena-black via-arena-blood/[0.07] to-arena-black pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-arena-crimson/[0.06] blur-[90px] rounded-full pointer-events-none" />

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <SectionLabel numeral="III" label="A Comunidade" />
          </ScrollReveal>

          {c.community.layout === "centered" ? (
            /* CENTERED — quote and cards stacked */
            <div className="max-w-2xl mx-auto text-center space-y-8">
              <ScrollReveal delay={0.1}>
                <blockquote className="font-[family-name:var(--font-display)] text-2xl sm:text-3xl text-arena-white/90 leading-snug mb-4">
                  {c.community.blockquote_line1}{" "}
                  <em className="text-arena-gold/80 not-italic">{c.community.blockquote_emphasis}</em>{" "}
                  {c.community.blockquote_line2}
                </blockquote>
                <p className="text-arena-smoke/80 text-base sm:text-lg leading-relaxed">{c.community.desc}</p>
              </ScrollReveal>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
                {c.community.cards.map((card, i) => (
                  <ScrollReveal key={card.title} delay={0.1 * (i + 1)}>
                    <a href={card.href} className="block group">
                      <div className="flex gap-4 p-4 rounded-sm border border-arena-gold/15 bg-arena-gold/[0.03] hover:border-arena-gold/35 hover:bg-arena-gold/[0.07] transition-all duration-300 h-full">
                        <span className="text-xl leading-none mt-0.5 shrink-0 group-hover:scale-110 transition-transform duration-300">{card.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-[family-name:var(--font-ui)] text-arena-gold/85 tracking-wider text-sm uppercase mb-1 group-hover:text-arena-gold transition-colors duration-300">{card.title}</p>
                          <p className="text-arena-smoke/65 text-sm leading-relaxed">{card.desc}</p>
                        </div>
                      </div>
                    </a>
                  </ScrollReveal>
                ))}
              </div>
            </div>
          ) : (
            /* SPLIT (default) */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 xl:gap-14 items-start">
              <div className="lg:col-span-7">
                <ScrollReveal delay={0.1}>
                  <blockquote className="font-[family-name:var(--font-display)] text-2xl sm:text-3xl lg:text-[2rem] text-arena-white/90 leading-snug mb-6">
                    {c.community.blockquote_line1}{" "}
                    <em className="text-arena-gold/80 not-italic">{c.community.blockquote_emphasis}</em>{" "}
                    {c.community.blockquote_line2}
                  </blockquote>
                  <p className="text-arena-smoke/80 text-base sm:text-lg leading-relaxed max-w-lg">{c.community.desc}</p>
                </ScrollReveal>
              </div>
              <div className="lg:col-span-5 space-y-3">
                {c.community.cards.map((card, i) => (
                  <ScrollReveal key={card.title} delay={0.1 * (i + 1)}>
                    <a href={card.href} className="block group">
                      <div className="flex gap-4 p-4 sm:p-5 rounded-sm border border-arena-gold/15 bg-arena-gold/[0.03] hover:border-arena-gold/35 hover:bg-arena-gold/[0.07] transition-all duration-300">
                        <span className="text-xl leading-none mt-0.5 shrink-0 group-hover:scale-110 transition-transform duration-300">{card.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-[family-name:var(--font-ui)] text-arena-gold/85 tracking-wider text-sm uppercase mb-1 group-hover:text-arena-gold transition-colors duration-300">{card.title}</p>
                          <p className="text-arena-smoke/65 text-sm leading-relaxed">{card.desc}</p>
                        </div>
                        <span className="text-arena-gold/30 group-hover:text-arena-gold/70 transition-colors duration-300 text-sm self-center shrink-0">→</span>
                      </div>
                    </a>
                  </ScrollReveal>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>


      {/* ═══════════════════════════════════════════════════════════
          IV — CRONOLOGIA — layout: "left-line" | "alternating" | "compact"
          ══════════════════════════════════════════════════════════ */}
      <section className="py-20 sm:py-28">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <SectionLabel numeral="IV" label="Cronologia do Brutus" />
            <div className="mb-12 -mt-4">
              <h2 className="font-[family-name:var(--font-display)] text-arena-white/85 text-xl sm:text-2xl tracking-wide">{c.timeline.section_title}</h2>
            </div>
          </ScrollReveal>

          {c.timeline.layout === "compact" ? (
            /* COMPACT — dense table-like rows */
            <div className="space-y-0 border border-arena-gold/15 rounded-sm overflow-hidden">
              {c.timeline.items.map((item, i) => {
                const accentColor = item.accent === "gold" ? "border-arena-gold/40 bg-arena-gold/[0.04]" : item.accent === "crimson" ? "border-arena-crimson/40 bg-arena-crimson/[0.04]" : "border-arena-gold/10 bg-transparent";
                return (
                  <ScrollReveal key={item.id} delay={0.07 * (i + 1)}>
                    <div className={`flex gap-0 border-b last:border-b-0 ${accentColor}`}>
                      <div className="w-20 sm:w-24 shrink-0 flex items-center justify-center border-r border-arena-gold/10 px-3 py-4">
                        <span className="font-[family-name:var(--font-ui)] text-arena-gold text-xs tracking-wider text-center leading-tight">{item.year}</span>
                      </div>
                      <div className="flex-1 px-5 py-4 min-w-0">
                        <p className="font-[family-name:var(--font-ui)] text-arena-white/90 text-sm tracking-wider uppercase mb-1">{item.label}</p>
                        <p className="text-arena-smoke/65 text-sm leading-relaxed">{item.desc}</p>
                        {item.image && <img src={item.image} alt={item.label} className="w-full max-w-xs h-auto rounded-sm border border-arena-gold/15 mt-3" />}
                        {item.video && <TwitchEmbed url={item.video} label={item.label} />}
                      </div>
                    </div>
                  </ScrollReveal>
                );
              })}
            </div>
          ) : c.timeline.layout === "alternating" ? (
            /* ALTERNATING — zigzag left/right */
            <div className="relative">
              <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-arena-gold/30 via-arena-gold/15 to-transparent hidden sm:block" />
              <div className="space-y-10">
                {c.timeline.items.map((item, i) => {
                  const isRight = i % 2 === 0;
                  const accentBorder = item.accent === "gold" ? "border-arena-gold/40" : item.accent === "crimson" ? "border-arena-crimson/40" : "border-arena-gold/20";
                  return (
                    <ScrollReveal key={item.id} delay={0.1 * (i + 1)}>
                      <div className={`flex gap-6 items-start sm:w-[calc(50%-2rem)] ${isRight ? "sm:ml-0 sm:pr-8" : "sm:ml-auto sm:pl-8"}`}>
                        <div className={`sm:hidden relative shrink-0 flex flex-col items-center`}>
                          <div className={`w-10 h-10 rounded-sm border ${accentBorder} bg-arena-gold/[0.06] flex items-center justify-center z-10`}>
                            <span className="font-[family-name:var(--font-ui)] text-arena-gold text-xs tracking-wider text-center">{item.year}</span>
                          </div>
                        </div>
                        <div className={`stone-panel rounded-sm p-5 flex-1 border ${accentBorder}`}>
                          <p className="font-[family-name:var(--font-ui)] text-arena-gold text-xs tracking-[0.22em] uppercase mb-1 hidden sm:block">{item.year}</p>
                          <h3 className="font-[family-name:var(--font-ui)] text-arena-white/90 text-sm sm:text-base tracking-wider uppercase mb-2">{item.label}</h3>
                          <p className="text-arena-smoke/70 text-sm leading-relaxed">{item.desc}</p>
                          {item.image && <img src={item.image} alt={item.label} className="w-full h-auto rounded-sm border border-arena-gold/15 mt-3" />}
                          {item.video && <TwitchEmbed url={item.video} label={item.label} />}
                        </div>
                      </div>
                    </ScrollReveal>
                  );
                })}
              </div>
            </div>
          ) : (
            /* LEFT-LINE (default) */
            <div className="relative">
              <div className="absolute left-6 sm:left-8 top-0 bottom-0 w-px bg-gradient-to-b from-arena-gold/30 via-arena-gold/15 to-transparent" />
              <div className="space-y-12 sm:space-y-16">
                {c.timeline.items.map((item, i) => {
                  const accentBorder = item.accent === "gold" ? "border-arena-gold/40" : item.accent === "crimson" ? "border-arena-crimson/40" : "border-arena-gold/30";
                  return (
                    <ScrollReveal key={item.id} delay={0.1 * (i + 1)}>
                      <div className="flex gap-6 sm:gap-10 items-start pl-2">
                        <div className="relative shrink-0 flex flex-col items-center">
                          <div className={`w-10 h-10 sm:w-14 sm:h-14 rounded-sm border ${accentBorder} bg-arena-gold/[0.06] flex items-center justify-center z-10`}>
                            <span className="font-[family-name:var(--font-ui)] text-arena-gold text-xs sm:text-sm tracking-wider leading-none text-center">{item.year}</span>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0 pb-2">
                          <h3 className="font-[family-name:var(--font-ui)] text-arena-white/90 text-base sm:text-lg tracking-wider uppercase mb-2">{item.label}</h3>
                          <p className="text-arena-smoke/70 text-sm sm:text-base leading-relaxed mb-4">{item.desc}</p>
                          {item.image && (
                            <div className="relative w-full max-w-lg rounded-sm overflow-hidden border border-arena-gold/15 mb-4">
                              <img src={item.image} alt={item.label} className="w-full h-auto object-cover" />
                            </div>
                          )}
                          {item.video && <TwitchEmbed url={item.video} label={item.label} />}
                        </div>
                      </div>
                    </ScrollReveal>
                  );
                })}
              </div>
            </div>
          )}
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
            {c.closing.text}
          </p>
        </ScrollReveal>
      </section>

    </div>
  );
}
