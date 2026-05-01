"use client";

import type { Metadata } from "next";
import Link from "next/link";
import { motion } from "framer-motion";

const MODERADOR_CATEGORIES = [
  {
    href: "/admin/outros/daily-session",
    title: "Sessão do Dia",
    description: "Gestão e configuração da sessão diária de streams",
    icon: "🎮",
    color: "from-blue-600/20 to-blue-500/10",
    borderColor: "border-blue-500/30",
    hoverColor: "hover:border-blue-500/50",
  },
  {
    href: "/admin/outros/bonus-hunt",
    title: "Bonus Hunt",
    description: "Importação e gestão de sessões de bonus hunts",
    icon: "🎯",
    color: "from-purple-600/20 to-purple-500/10",
    borderColor: "border-purple-500/30",
    hoverColor: "hover:border-purple-500/50",
  },
  {
    href: "/admin/outros/calendario",
    title: "Calendário",
    description: "Gestão de streams agendadas e eventos",
    icon: "📅",
    color: "from-green-600/20 to-green-500/10",
    borderColor: "border-green-500/30",
    hoverColor: "hover:border-green-500/50",
  },
  {
    href: "/admin/outros/giveaways",
    title: "Giveaways",
    description: "Gestão de sorteios e prémios da arena",
    icon: "🎁",
    color: "from-pink-600/20 to-pink-500/10",
    borderColor: "border-pink-500/30",
    hoverColor: "hover:border-pink-500/50",
  },
  {
    href: "/admin/outros/liga",
    title: "Liga dos Brutus",
    description: "Configuração da liga e sistema de torneios",
    icon: "⚔️",
    color: "from-red-600/20 to-red-500/10",
    borderColor: "border-red-500/30",
    hoverColor: "hover:border-red-500/50",
  },
  {
    href: "/moderador/hall-of-victors",
    title: "Bruta do Mês",
    description: "Aprova ou rejeita as vitórias submetidas pela comunidade",
    icon: "👑",
    color: "from-yellow-600/20 to-yellow-500/10",
    borderColor: "border-arena-gold/40",
    hoverColor: "hover:border-arena-gold/60",
  },
] as const;

export default function ModeradorPage() {
  return (
    <div className="pt-24 pb-16 min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Moderador Category Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {MODERADOR_CATEGORIES.map((category, index) => (
            <Link
              key={category.href}
              href={category.href}
              className="group block"
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`relative rounded-xl border ${category.borderColor} ${category.hoverColor} bg-gradient-to-br ${category.color} backdrop-blur-sm p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-green-500/5`}
              >
                {/* Icon */}
                <div className="text-5xl mb-4">{category.icon}</div>

                {/* Title */}
                <h3 className="font-[family-name:var(--font-display)] text-green-500 text-xl tracking-wide mb-2 group-hover:text-white transition-colors">
                  {category.title}
                </h3>

                {/* Description */}
                <p className="text-arena-smoke/60 text-sm leading-relaxed mb-4">
                  {category.description}
                </p>

                {/* Arrow */}
                <div className="flex items-center text-green-500/60 text-sm font-medium group-hover:text-green-500 transition-colors">
                  <span>Explorar</span>
                  <svg
                    className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>

                {/* Glow effect on hover */}
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-green-500/0 to-green-500/0 group-hover:from-green-500/5 group-hover:to-transparent transition-all duration-300 pointer-events-none" />
              </motion.div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
