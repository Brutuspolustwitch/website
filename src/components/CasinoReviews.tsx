"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import reviewsData from "@/data/casino-reviews.json";
import { supabase } from "@/lib/supabase";

/* ── Safety badge colour mapping ──────────────────────────── */
function safetyColor(index: number) {
  if (index >= 9.0) return { bg: "bg-green-900/40", border: "border-green-500/50", text: "text-green-400" };
  if (index >= 8.0) return { bg: "bg-emerald-900/40", border: "border-emerald-500/50", text: "text-emerald-400" };
  if (index >= 7.0) return { bg: "bg-yellow-900/40", border: "border-yellow-500/50", text: "text-yellow-400" };
  return { bg: "bg-red-900/40", border: "border-red-500/50", text: "text-red-400" };
}

/* ── Star display ─────────────────────────────────────────── */
function Stars({ rating }: { rating: number }) {
  const full = Math.floor(rating / 2);
  const half = rating % 2 >= 1;
  return (
    <span className="inline-flex gap-0.5 text-arena-gold text-lg">
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={i < full ? "opacity-100" : i === full && half ? "opacity-50" : "opacity-20"}>
          ★
        </span>
      ))}
    </span>
  );
}

/* ── Expanded review detail ───────────────────────────────── */
function ReviewDetail({ casino }: { casino: (typeof reviewsData)[number] }) {
  const sc = safetyColor(casino.safety_index);

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3 }}
      className="overflow-hidden"
    >
      <div className="px-4 sm:px-6 pb-6 pt-2 space-y-6">
        {/* Overview */}
        <p className="text-arena-smoke text-sm leading-relaxed">{casino.overview}</p>

        {/* Grid info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Company */}
          <div className="bg-white/[0.03] rounded-lg p-4 border border-white/5">
            <h4 className="text-arena-gold text-xs font-bold uppercase tracking-wider mb-3">Empresa</h4>
            <dl className="space-y-2 text-sm">
              <div><dt className="text-arena-ash text-xs">Proprietário</dt><dd className="text-arena-smoke">{casino.company.owner}</dd></div>
              <div><dt className="text-arena-ash text-xs">Receita estimada</dt><dd className="text-arena-smoke">{casino.company.estimated_revenue}</dd></div>
              <div><dt className="text-arena-ash text-xs">Licença</dt><dd className="text-arena-smoke">{casino.company.license}</dd></div>
            </dl>
          </div>

          {/* Payment */}
          <div className="bg-white/[0.03] rounded-lg p-4 border border-white/5">
            <h4 className="text-arena-gold text-xs font-bold uppercase tracking-wider mb-3">Pagamentos</h4>
            <dl className="space-y-2 text-sm">
              <div><dt className="text-arena-ash text-xs">Limite de levantamento</dt><dd className="text-arena-smoke">{casino.payment.withdrawal_limit}</dd></div>
              <div><dt className="text-arena-ash text-xs">Ganho máximo</dt><dd className="text-arena-smoke">{casino.payment.max_win_limit}</dd></div>
              {"methods" in casino.payment && (casino.payment as { methods?: string[] }).methods && (
                <div>
                  <dt className="text-arena-ash text-xs mb-1.5">Métodos ({casino.payment.methods_count})</dt>
                  <dd className="flex flex-wrap gap-1">
                    {((casino.payment as { methods: string[] }).methods).map((m) => (
                      <span key={m} className="px-1.5 py-0.5 rounded bg-white/5 text-arena-smoke text-[10px] border border-white/5">
                        {m}
                      </span>
                    ))}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* Support */}
          <div className="bg-white/[0.03] rounded-lg p-4 border border-white/5">
            <h4 className="text-arena-gold text-xs font-bold uppercase tracking-wider mb-3">Suporte</h4>
            <dl className="space-y-2 text-sm">
              <div><dt className="text-arena-ash text-xs">Classificação</dt><dd className="text-arena-smoke">{casino.customer_support.rating}</dd></div>
              <div>
                <dt className="text-arena-ash text-xs">Idiomas</dt>
                <dd className="text-arena-smoke">{casino.customer_support.languages.map((l) => l.language).join(", ")}</dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Bonuses */}
        {casino.bonuses.length > 0 && (
          <div>
            <h4 className="text-arena-gold text-xs font-bold uppercase tracking-wider mb-3">Bónus</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {casino.bonuses.map((b, i) => {
                const bonus = b as Record<string, unknown>;
                if (bonus.value === "Indisponível") return null;
                return (
                  <div
                    key={i}
                    className={`rounded-lg p-3 border ${
                      bonus.type === "Sem Depósito"
                        ? "bg-arena-gold/10 border-arena-gold/30"
                        : "bg-white/[0.03] border-white/10"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`text-xs font-bold uppercase tracking-wider ${bonus.type === "Sem Depósito" ? "text-arena-gold" : "text-arena-smoke"}`}>
                        {String(bonus.type)}
                      </span>
                      {bonus.promo_code ? (
                        <span className="text-[10px] font-mono bg-arena-gold/20 text-arena-gold px-2 py-0.5 rounded border border-arena-gold/30">
                          {String(bonus.promo_code)}
                        </span>
                      ) : null}
                    </div>
                    <p className="text-arena-white text-sm font-semibold">{String(bonus.value)}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-[11px] text-arena-ash">
                      {bonus.wagering ? <span>Wagering: <span className="text-arena-smoke">{String(bonus.wagering)}</span></span> : null}
                      {bonus.min_deposit ? <span>Depósito mín: <span className="text-arena-smoke">{String(bonus.min_deposit)}</span></span> : null}
                      {bonus.expiry ? <span>Expira: <span className="text-arena-smoke">{String(bonus.expiry)}</span></span> : null}
                      {bonus.max_withdrawal ? <span>Levant. máx: <span className="text-arena-smoke">{String(bonus.max_withdrawal)}</span></span> : null}
                      {bonus.sticky ? <span className="text-yellow-500">Sticky</span> : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Games */}
        <div>
          <h4 className="text-arena-gold text-xs font-bold uppercase tracking-wider mb-3">
            Jogos ({casino.games.providers_count} fornecedores)
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {casino.games.types.map((t) => (
              <span key={t} className="px-2 py-1 rounded bg-white/5 text-arena-smoke text-xs border border-white/5">
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* Pros & Cons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {casino.pros.length > 0 && (
            <div>
              <h4 className="text-green-400 text-xs font-bold uppercase tracking-wider mb-2">✓ Vantagens</h4>
              <ul className="space-y-1">
                {casino.pros.map((p, i) => (
                  <li key={i} className="text-sm text-arena-smoke flex items-start gap-2">
                    <span className="text-green-500 mt-0.5 shrink-0">•</span>{p}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {casino.cons.length > 0 && (
            <div>
              <h4 className="text-red-400 text-xs font-bold uppercase tracking-wider mb-2">✗ Desvantagens</h4>
              <ul className="space-y-1">
                {casino.cons.map((c, i) => (
                  <li key={i} className="text-sm text-arena-smoke flex items-start gap-2">
                    <span className="text-red-500 mt-0.5 shrink-0">•</span>{c}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

      </div>
    </motion.div>
  );
}

/* ── Main Reviews Component ──────────────────────────────── */
export function CasinoReviews() {
  const [expandedSlug, setExpandedSlug] = useState<string | null>(null);
  const [affiliateUrls, setAffiliateUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("casino_affiliates")
        .select("slug, affiliate_url");
      if (data) {
        const map: Record<string, string> = {};
        for (const row of data) {
          map[row.slug] = row.affiliate_url;
        }
        setAffiliateUrls(map);
      }
    })();
  }, []);

  const sorted = [...reviewsData].sort((a, b) => b.safety_index - a.safety_index);

  return (
    <div className="space-y-4">
      {sorted.map((casino, idx) => {
        const sc = safetyColor(casino.safety_index);
        const isOpen = expandedSlug === casino.slug;
        const affiliateUrl = affiliateUrls[casino.slug];

        return (
          <motion.div
            key={casino.slug}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.08 }}
            className={`rounded-xl border transition-colors duration-200 overflow-hidden ${
              isOpen
                ? "bg-white/[0.04] border-arena-gold/30"
                : "bg-white/[0.02] border-white/5 hover:border-white/10 hover:bg-white/[0.03]"
            }`}
          >
            {/* Header row */}
            <div className="flex items-center">
              {/* Clickable area → affiliate URL */}
              <a
                href={affiliateUrl || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center gap-4 px-4 sm:px-6 py-5 text-left cursor-pointer min-w-0"
              >
                {/* Rank */}
                <span className="text-arena-gold/40 font-display text-2xl font-bold w-8 text-center shrink-0">
                  {idx + 1}
                </span>

                {/* Safety badge */}
                <div
                  className={`shrink-0 flex flex-col items-center justify-center w-14 h-14 rounded-lg border ${sc.bg} ${sc.border}`}
                >
                  <span className={`text-lg font-bold leading-none ${sc.text}`}>{casino.safety_index}</span>
                  <span className={`text-[9px] uppercase font-bold tracking-wider mt-0.5 ${sc.text}`}>
                    {casino.safety_index >= 9 ? "Top" : casino.safety_index >= 8 ? "Alto" : "Med"}
                  </span>
                </div>

                {/* Name + meta */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-arena-white font-display text-lg sm:text-xl font-semibold truncate">
                    {casino.name}
                  </h3>
                  <div className="flex items-center gap-3 mt-1">
                    <Stars rating={casino.safety_index} />
                    <span className="text-arena-ash text-xs">{casino.safety_label}</span>
                    {casino.user_rating && (
                      <span className="text-arena-smoke text-xs">
                        · {casino.user_reviews_count} avaliações
                      </span>
                    )}
                  </div>
                </div>

                {/* Bonus preview */}
                <div className="hidden md:block text-right shrink-0">
                  {casino.bonuses[0] && casino.bonuses[0].value !== "Indisponível" && (
                    <span className="text-arena-gold text-sm font-medium">{casino.bonuses[0].value}</span>
                  )}
                  <div className="text-arena-ash text-xs mt-0.5">{casino.games.providers_count} fornecedores</div>
                </div>
              </a>

              {/* Chevron toggle — expands details */}
              <button
                onClick={() => setExpandedSlug(isOpen ? null : casino.slug)}
                className="p-4 text-arena-ash hover:text-arena-white transition-colors shrink-0"
                aria-label={`${isOpen ? "Colapsar" : "Expandir"} ${casino.name}`}
              >
                <motion.svg
                  animate={{ rotate: isOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </motion.svg>
              </button>
            </div>

            {/* Expandable detail */}
            <AnimatePresence>
              {isOpen && <ReviewDetail casino={casino} />}
            </AnimatePresence>
          </motion.div>
        );
      })}

      {/* Source attribution */}
      <p className="text-center text-arena-ash text-xs mt-8">
        Dados recolhidos de{" "}
        <a
          href="https://pt.casino.guru"
          target="_blank"
          rel="noopener noreferrer"
          className="text-arena-gold/60 hover:text-arena-gold transition-colors"
        >
          Casino.Guru
        </a>{" "}
        — última atualização: Abril 2026
      </p>
    </div>
  );
}
