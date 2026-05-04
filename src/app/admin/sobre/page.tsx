"use client";

import { useAuth } from "@/lib/auth-context";
import { hasRole } from "@/lib/roles";
import { useEffect, useState, useCallback } from "react";

/* ── Types (mirrored from SobreContent.tsx) ──────────────── */
interface ArenaType { icon: string; label: string; badge: string; desc: string; variant: "gold" | "crimson"; href: string | null; }
interface TimelineItem { year: string; label: string; desc: string; image?: string | null; video?: string | null; }
interface Stat { value: string; label: string; }
interface CommunityCard { icon: string; title: string; desc: string; href: string; }
interface SobreData {
  hero: { prelabel: string; title: string; subtitle: string; history_label: string; };
  bio: { p1_bold: string; p1: string; p2: string; p3: string; p3_highlight: string; quote: string; stats: Stat[]; };
  arena: { section_title: string; section_desc: string; types: ArenaType[]; };
  community: { blockquote_line1: string; blockquote_emphasis: string; blockquote_line2: string; desc: string; cards: CommunityCard[]; };
  timeline: { section_title: string; items: TimelineItem[]; };
  closing: { text: string; };
}

const DEFAULTS: SobreData = {
  hero: { prelabel: "Brutuspolus · Streamer · Portugal", title: "ENTRA NA ARENA", subtitle: "Sem filtros · Sem encenação · Só a arena", history_label: "A História" },
  bio: {
    p1_bold: "Apaixonado pelo gambling",
    p1: "desde os tempos em que estudava na Universidade de Direito de Coimbra. O poker era o passatempo nas pausas dos estudos — e foi aí que as slots apareceram pela primeira vez, a jogar com os amigos. Estava descoberta a entrada para este mundo.",
    p2: "Encontrei a Twitch — era a primeira vez que entrava nesta plataforma. Criei uma conta, pesquisei artigos, vi vídeos de como configurar o canal e comecei esta aventura. Seria suficiente? Achei que não.",
    p3: "Fui evoluindo cada vez mais o canal e, comigo, foi crescendo também uma equipa que me tem ajudado a concretizar este projeto.",
    p3_highlight: "O que era um momento de diversão, passou a ser o meu trabalho diário.",
    quote: "Aqui não há histórias bonitas.\nSó a verdade do jogo.",
    stats: [
      { value: "1990", label: "Nascido" }, { value: "Coimbra", label: "Origem" },
      { value: "2020", label: "Streaming Slots desde" }, { value: "100%", label: "Real e Ao Vivo" },
    ],
  },
  arena: {
    section_title: "O que acontece na arena",
    section_desc: "Cada sessão tem o seu propósito. Cada batalha, o seu nome.",
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
    cards: [
      { icon: "🏆", title: "Leaderboard", desc: "A tabela dos nossos Brutus", href: "/leaderboard" },
      { icon: "⚔", title: "Bruta do Mês", desc: "Onde partilhas as tuas vitórias e ganhas prémios", href: "/hall-of-victories" },
      { icon: "🎁", title: "Giveaways", desc: "Sorteios que decorrem na nossa live stream", href: "/giveaways" },
    ],
  },
  timeline: {
    section_title: "A linha do tempo",
    items: [
      { year: "1990", label: "Nasce em Coimbra", desc: "Coimbra, Portugal. O início de tudo.", image: null, video: null },
      { year: "2015", label: "Poker & Slots em Coimbra", desc: "Durante os anos na Universidade de Direito, o poker era o passatempo. As slots vieram nas pausas dos estudos — e foi aí que este mundo começou.", image: null, video: null },
      { year: "2020", label: "Início do Streaming", desc: "Encontrou a Twitch pela primeira vez. Criou uma conta, pesquisou, aprendeu e lançou o canal. O que era diversão passou a ser trabalho diário.", image: null, video: null },
      { year: "Hoje", label: "A Arena Está Aberta", desc: "Uma equipa, uma comunidade e um canal que cresceu com o seu criador. A arena aguarda.", image: null, video: "https://www.twitch.tv/brutuspolus" },
    ],
  },
  closing: { text: "A arena está aberta · A família aguarda" },
};

/* ── Small reusable field components ─────────────────────── */
function Field({ label, value, onChange, multiline = false, rows = 3 }: {
  label: string; value: string; onChange: (v: string) => void; multiline?: boolean; rows?: number;
}) {
  const cls = "w-full bg-arena-iron/50 border border-arena-gold/20 rounded-sm px-3 py-2 text-arena-smoke/90 text-sm focus:outline-none focus:border-arena-gold/50 focus:ring-1 focus:ring-arena-gold/30 transition-colors";
  return (
    <div className="space-y-1">
      <label className="block text-[11px] font-medium text-arena-smoke/60 uppercase tracking-wider">{label}</label>
      {multiline
        ? <textarea className={cls} rows={rows} value={value} onChange={e => onChange(e.target.value)} />
        : <input type="text" className={cls} value={value} onChange={e => onChange(e.target.value)} />
      }
    </div>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="h-px flex-1 bg-arena-gold/20" />
      <span className="font-[family-name:var(--font-display)] text-arena-gold/70 text-xs tracking-[0.22em] uppercase">{title}</span>
      <div className="h-px flex-1 bg-arena-gold/20" />
    </div>
  );
}

/* ── Main page ────────────────────────────────────────────── */
export default function AdminSobrePage() {
  const { user } = useAuth();
  const [data, setData] = useState<SobreData>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/sobre-content")
      .then(r => r.json())
      .then(({ data: d }) => {
        if (d) {
          setData(() => ({ ...DEFAULTS, ...d, bio: { ...DEFAULTS.bio, ...d.bio }, hero: { ...DEFAULTS.hero, ...d.hero }, arena: { ...DEFAULTS.arena, ...d.arena, types: d.arena?.types ?? DEFAULTS.arena.types }, community: { ...DEFAULTS.community, ...d.community, cards: d.community?.cards ?? DEFAULTS.community.cards }, timeline: { ...DEFAULTS.timeline, ...d.timeline, items: d.timeline?.items ?? DEFAULTS.timeline.items }, closing: { ...DEFAULTS.closing, ...d.closing } }));
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await fetch("/api/sobre-content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  }, [data]);

  if (!user || !hasRole(user.role, "admin")) {
    return (
      <div className="pt-24 pb-16 min-h-screen flex items-center justify-center">
        <p className="text-arena-smoke/50 text-sm">Acesso negado.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="pt-24 pb-16 min-h-screen flex items-center justify-center">
        <p className="text-arena-smoke/50 text-sm animate-pulse">A carregar…</p>
      </div>
    );
  }

  /* ── helpers ── */
  const setHero = (k: keyof SobreData["hero"], v: string) => setData(d => ({ ...d, hero: { ...d.hero, [k]: v } }));
  const setBio = (k: keyof SobreData["bio"], v: string) => setData(d => ({ ...d, bio: { ...d.bio, [k]: v } }));
  const setStat = (i: number, k: keyof Stat, v: string) => setData(d => { const stats = [...d.bio.stats]; stats[i] = { ...stats[i], [k]: v }; return { ...d, bio: { ...d.bio, stats } }; });
  const setArena = (k: "section_title" | "section_desc", v: string) => setData(d => ({ ...d, arena: { ...d.arena, [k]: v } }));
  const setArenaType = (i: number, k: keyof ArenaType, v: string) => setData(d => { const types = [...d.arena.types]; types[i] = { ...types[i], [k]: v } as ArenaType; return { ...d, arena: { ...d.arena, types } }; });
  const setCommunity = (k: "blockquote_line1" | "blockquote_emphasis" | "blockquote_line2" | "desc", v: string) => setData(d => ({ ...d, community: { ...d.community, [k]: v } }));
  const setCommunityCard = (i: number, k: keyof CommunityCard, v: string) => setData(d => { const cards = [...d.community.cards]; cards[i] = { ...cards[i], [k]: v }; return { ...d, community: { ...d.community, cards } }; });
  const setTimeline = (k: "section_title", v: string) => setData(d => ({ ...d, timeline: { ...d.timeline, [k]: v } }));
  const setTimelineItem = (i: number, k: keyof TimelineItem, v: string) => setData(d => { const items = [...d.timeline.items]; items[i] = { ...items[i], [k]: v }; return { ...d, timeline: { ...d.timeline, items } }; });
  const setClosing = (v: string) => setData(d => ({ ...d, closing: { text: v } }));

  return (
    <div className="pt-24 pb-16 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">

        {/* Page title */}
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-arena-gold text-2xl tracking-wide mb-1">Editar Página Sobre</h1>
          <p className="text-arena-smoke/50 text-sm">Todos os textos da página /sobre são editáveis aqui.</p>
        </div>

        {/* ── I. Hero ── */}
        <div className="bg-arena-iron/30 border border-arena-gold/15 rounded-sm p-6 space-y-4">
          <SectionHeader title="I · Hero" />
          <Field label="Pré-label (topo)" value={data.hero.prelabel} onChange={v => setHero("prelabel", v)} />
          <Field label="Título principal" value={data.hero.title} onChange={v => setHero("title", v)} />
          <Field label="Subtítulo" value={data.hero.subtitle} onChange={v => setHero("subtitle", v)} />
          <Field label="Etiqueta história" value={data.hero.history_label} onChange={v => setHero("history_label", v)} />
        </div>

        {/* ── II. Quem Sou ── */}
        <div className="bg-arena-iron/30 border border-arena-gold/15 rounded-sm p-6 space-y-4">
          <SectionHeader title="II · Quem Sou" />
          <Field label="Parágrafo 1 — negrito inicial" value={data.bio.p1_bold} onChange={v => setBio("p1_bold", v)} />
          <Field label="Parágrafo 1 — continuação" value={data.bio.p1} onChange={v => setBio("p1", v)} multiline rows={3} />
          <Field label="Parágrafo 2" value={data.bio.p2} onChange={v => setBio("p2", v)} multiline rows={3} />
          <Field label="Parágrafo 3" value={data.bio.p3} onChange={v => setBio("p3", v)} multiline rows={2} />
          <Field label="Parágrafo 3 — destaque final" value={data.bio.p3_highlight} onChange={v => setBio("p3_highlight", v)} />
          <Field label="Citação (separar linhas com \\n)" value={data.bio.quote} onChange={v => setBio("quote", v)} multiline rows={2} />
        </div>

        {/* ── III. Stats ── */}
        <div className="bg-arena-iron/30 border border-arena-gold/15 rounded-sm p-6 space-y-4">
          <SectionHeader title="III · Stats" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {data.bio.stats.map((stat, i) => (
              <div key={i} className="flex gap-3">
                <Field label={`Stat ${i + 1} — Valor`} value={stat.value} onChange={v => setStat(i, "value", v)} />
                <Field label="Etiqueta" value={stat.label} onChange={v => setStat(i, "label", v)} />
              </div>
            ))}
          </div>
        </div>

        {/* ── IV. Arena ── */}
        <div className="bg-arena-iron/30 border border-arena-gold/15 rounded-sm p-6 space-y-6">
          <SectionHeader title="IV · Arena" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Título de secção" value={data.arena.section_title} onChange={v => setArena("section_title", v)} />
            <Field label="Descrição de secção" value={data.arena.section_desc} onChange={v => setArena("section_desc", v)} />
          </div>
          {data.arena.types.map((type, i) => (
            <div key={i} className="border border-arena-gold/10 rounded-sm p-4 space-y-3">
              <p className="text-[10px] text-arena-gold/50 uppercase tracking-widest">Tipo {i + 1}</p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Ícone" value={type.icon} onChange={v => setArenaType(i, "icon", v)} />
                <Field label="Nome" value={type.label} onChange={v => setArenaType(i, "label", v)} />
                <Field label="Badge" value={type.badge} onChange={v => setArenaType(i, "badge", v)} />
                <Field label="Variante (gold / crimson)" value={type.variant} onChange={v => setArenaType(i, "variant", v)} />
              </div>
              <Field label="Descrição" value={type.desc} onChange={v => setArenaType(i, "desc", v)} multiline rows={2} />
              <Field label="Link (ou vazio)" value={type.href ?? ""} onChange={v => setArenaType(i, "href", v || null as unknown as string)} />
            </div>
          ))}
        </div>

        {/* ── V. Comunidade ── */}
        <div className="bg-arena-iron/30 border border-arena-gold/15 rounded-sm p-6 space-y-4">
          <SectionHeader title="V · Comunidade" />
          <Field label="Citação — linha 1" value={data.community.blockquote_line1} onChange={v => setCommunity("blockquote_line1", v)} />
          <Field label="Citação — destaque em itálico" value={data.community.blockquote_emphasis} onChange={v => setCommunity("blockquote_emphasis", v)} />
          <Field label="Citação — linha 2" value={data.community.blockquote_line2} onChange={v => setCommunity("blockquote_line2", v)} />
          <Field label="Descrição" value={data.community.desc} onChange={v => setCommunity("desc", v)} multiline rows={3} />
          <div className="space-y-3">
            {data.community.cards.map((card, i) => (
              <div key={i} className="border border-arena-gold/10 rounded-sm p-4 space-y-3">
                <p className="text-[10px] text-arena-gold/50 uppercase tracking-widest">Card {i + 1}</p>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Ícone" value={card.icon} onChange={v => setCommunityCard(i, "icon", v)} />
                  <Field label="Título" value={card.title} onChange={v => setCommunityCard(i, "title", v)} />
                  <Field label="Descrição" value={card.desc} onChange={v => setCommunityCard(i, "desc", v)} />
                  <Field label="Link" value={card.href} onChange={v => setCommunityCard(i, "href", v)} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── VI. Timeline ── */}
        <div className="bg-arena-iron/30 border border-arena-gold/15 rounded-sm p-6 space-y-4">
          <SectionHeader title="VI · Cronologia" />
          <Field label="Título de secção" value={data.timeline.section_title} onChange={v => setTimeline("section_title", v)} />
          {data.timeline.items.map((item, i) => (
            <div key={i} className="border border-arena-gold/10 rounded-sm p-4 space-y-3">
              <p className="text-[10px] text-arena-gold/50 uppercase tracking-widest">Item {i + 1}</p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Ano / Etiqueta temporal" value={item.year} onChange={v => setTimelineItem(i, "year", v)} />
                <Field label="Título do item" value={item.label} onChange={v => setTimelineItem(i, "label", v)} />
              </div>
              <Field label="Descrição" value={item.desc} onChange={v => setTimelineItem(i, "desc", v)} multiline rows={2} />
              <Field label="URL da imagem (ou vazio)" value={item.image ?? ""} onChange={v => setTimelineItem(i, "image", v || null as unknown as string)} />
              {item.image && (
                <img src={item.image} alt={item.label} className="w-full max-w-xs h-auto rounded-sm border border-arena-gold/15 mt-1" />
              )}
              <Field label="Link de vídeo (Twitch, ou vazio)" value={item.video ?? ""} onChange={v => setTimelineItem(i, "video", v || null as unknown as string)} />
            </div>
          ))}
        </div>

        {/* ── VII. Closing ── */}
        <div className="bg-arena-iron/30 border border-arena-gold/15 rounded-sm p-6 space-y-4">
          <SectionHeader title="VII · Fecho" />
          <Field label="Texto de fecho" value={data.closing.text} onChange={v => setClosing(v)} />
        </div>

        {/* ── Save button ── */}
        <div className="flex items-center gap-4 pt-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-8 py-3 bg-arena-gold text-arena-iron font-[family-name:var(--font-ui)] text-sm tracking-wider uppercase rounded-sm hover:bg-arena-gold/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? "A guardar…" : "Guardar alterações"}
          </button>
          {saved && (
            <span className="text-green-400/80 text-sm">✓ Guardado com sucesso</span>
          )}
        </div>

      </div>
    </div>
  );
}
