import Link from "next/link";
import Image from "next/image";
import { NAV_LINKS, SITE_NAME } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="bg-arena-dark border-t border-arena-gold/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Image
                src="/images/logo.png"
                alt={SITE_NAME}
                width={140}
                height={35}
                className="h-7 w-auto"
              />
            </div>
            <p className="text-sm text-arena-ash leading-relaxed">
              A arena definitiva de iGaming. Streams ao vivo, torneios exclusivos
              e a melhor comunidade de casino online.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="font-[family-name:var(--font-display)] text-arena-gold text-sm font-bold mb-4 tracking-wider uppercase">
              Navegação
            </h3>
            <ul className="space-y-2">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-arena-ash hover:text-arena-gold transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Disclaimer */}
          <div>
            <h3 className="font-[family-name:var(--font-display)] text-arena-gold text-sm font-bold mb-4 tracking-wider uppercase">
              Aviso Legal
            </h3>
            <p className="text-xs text-arena-ash leading-relaxed">
              O jogo envolve risco. Joga apenas com dinheiro que podes perder.
              Tens de ter 18+ para participar. Joga com responsabilidade.
              Este site contém links de afiliados.
            </p>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-arena-steel/30 text-center">
          <p className="text-xs text-arena-ash">
            &copy; {new Date().getFullYear()} {SITE_NAME}. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
