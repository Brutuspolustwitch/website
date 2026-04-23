"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const ANALYTICS_SECTIONS = [
  {
    href: "/admin/analitics/utilizadores",
    title: "Utilizadores",
    description: "Sessões, IPs, países e actividade de utilizadores",
    icon: "👥",
    color: "from-blue-600/20 to-blue-500/10",
    borderColor: "border-blue-500/30",
    hoverColor: "hover:border-blue-500/50",
  },
  {
    href: "/admin/analitics/ofertas",
    title: "Ofertas",
    description: "Performance de cliques e interações por oferta de casino",
    icon: "🎰",
    color: "from-green-600/20 to-green-500/10",
    borderColor: "border-green-500/30",
    hoverColor: "hover:border-green-500/50",
  },
  {
    href: "/admin/analitics/tempo-real",
    title: "Tempo Real",
    description: "Atividade ao vivo na plataforma — sessões e eventos",
    icon: "🔴",
    color: "from-red-600/20 to-red-500/10",
    borderColor: "border-red-500/30",
    hoverColor: "hover:border-red-500/50",
  },
  {
    href: "/admin/analitics/trafego",
    title: "Tráfego",
    description: "Fontes de tráfego — de onde vêm os visitantes",
    icon: "📈",
    color: "from-purple-600/20 to-purple-500/10",
    borderColor: "border-purple-500/30",
    hoverColor: "hover:border-purple-500/50",
  },
  {
    href: "/admin/analitics/geo",
    title: "Geo",
    description: "Distribuição geográfica dos visitantes por país e cidade",
    icon: "🌍",
    color: "from-teal-600/20 to-teal-500/10",
    borderColor: "border-teal-500/30",
    hoverColor: "hover:border-teal-500/50",
  },
  {
    href: "/admin/analitics/fraude",
    title: "Fraude",
    description: "Monitorização de sessões suspeitas e gestão de risco",
    icon: "🛡",
    color: "from-amber-600/20 to-amber-500/10",
    borderColor: "border-amber-500/30",
    hoverColor: "hover:border-amber-500/50",
  },
] as const;

export default function AnaliticsPage() {
  return (
    <div className="pt-24 pb-16 min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ANALYTICS_SECTIONS.map((section, index) => (
            <Link key={section.href} href={section.href} className="group block">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
                className={`relative rounded-xl border ${section.borderColor} ${section.hoverColor} bg-gradient-to-br ${section.color} backdrop-blur-sm p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-arena-gold/5`}
              >
                <div className="text-5xl mb-4">{section.icon}</div>
                <h3 className="font-[family-name:var(--font-display)] text-arena-gold text-xl tracking-wide mb-2 group-hover:text-white transition-colors">
                  {section.title}
                </h3>
                <p className="text-arena-smoke/60 text-sm leading-relaxed mb-4">
                  {section.description}
                </p>
                <div className="flex items-center gap-1 text-arena-gold/60 text-xs font-medium group-hover:text-arena-gold transition-colors">
                  <span className="uppercase tracking-wider">Explorar</span>
                  <span>›</span>
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
