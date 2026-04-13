import type { Metadata } from "next";
import { SectionHeading } from "@/components/ui/SectionHeading";

export const metadata: Metadata = {
  title: "Contactos",
  description: "Entra em contacto com a equipa Arena Gladiator. Parcerias, suporte e questões gerais.",
  openGraph: {
    title: "Contactos | Arena Gladiator",
    description: "Entra em contacto com a equipa Arena Gladiator.",
  },
};

export default function ContactosPage() {
  return (
    <div className="pt-24 pb-16 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading title="Contactos" subtitle="Fala connosco" />
        <div className="mt-12 max-w-xl mx-auto">
          <form className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-arena-smoke mb-2">Nome</label>
              <input
                type="text"
                id="name"
                className="w-full bg-arena-charcoal border border-arena-steel/30 rounded-lg px-4 py-3 text-arena-white placeholder-arena-ash focus:border-arena-gold focus:outline-none transition-colors"
                placeholder="O teu nome"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-arena-smoke mb-2">Email</label>
              <input
                type="email"
                id="email"
                className="w-full bg-arena-charcoal border border-arena-steel/30 rounded-lg px-4 py-3 text-arena-white placeholder-arena-ash focus:border-arena-gold focus:outline-none transition-colors"
                placeholder="o.teu@email.com"
              />
            </div>
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-arena-smoke mb-2">Mensagem</label>
              <textarea
                id="message"
                rows={5}
                className="w-full bg-arena-charcoal border border-arena-steel/30 rounded-lg px-4 py-3 text-arena-white placeholder-arena-ash focus:border-arena-gold focus:outline-none transition-colors resize-none"
                placeholder="A tua mensagem..."
              />
            </div>
            <button
              type="submit"
              className="w-full arena-button-primary py-3 text-sm font-bold tracking-wider uppercase"
            >
              Enviar Mensagem
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
