"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { hasRole } from "@/lib/roles";
import { usePageSettings } from "@/hooks/usePageSettings";

/** Derive the DB page_slug from the current pathname */
function slugFromPathname(pathname: string): string {
  if (pathname === "/") return "home";
  // Strip leading slash, strip trailing slash
  const clean = pathname.replace(/^\/|\/$/g, "");
  return clean;
}

/** Pages where we skip enforcement (admin panel has its own middleware) */
function isExempt(pathname: string): boolean {
  return pathname.startsWith("/admin") || pathname.startsWith("/api");
}

export function PageGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const slug = slugFromPathname(pathname);
  const { settings, loading: settingsLoading } = usePageSettings(slug);

  // Skip admin & API routes
  if (isExempt(pathname)) return <>{children}</>;

  // While loading, render children (avoids flash)
  if (authLoading || settingsLoading) return <>{children}</>;

  // Page not found in DB — allow through
  if (!settings) return <>{children}</>;

  // Page disabled — show unavailable screen
  if (!settings.is_active) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center space-y-4 max-w-md">
          <div className="text-5xl">🚧</div>
          <h1 className="text-2xl font-bold text-arena-gold font-[family-name:var(--font-display)]">
            Página Indisponível
          </h1>
          <p className="text-arena-smoke text-sm">
            Esta página está temporariamente desativada. Volta mais tarde.
          </p>
          <button
            onClick={() => router.push("/")}
            className="mt-4 px-6 py-2 rounded-lg bg-arena-crimson hover:bg-arena-red text-white text-sm transition-all cursor-pointer"
          >
            Voltar ao início
          </button>
        </div>
      </div>
    );
  }

  // Min role required — check user
  if (settings.min_role && settings.min_role !== "viewer") {
    const userRole = user?.role ?? undefined;
    if (!hasRole(userRole, settings.min_role)) {
      return (
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="text-center space-y-4 max-w-md">
            <div className="text-5xl">🔒</div>
            <h1 className="text-2xl font-bold text-arena-gold font-[family-name:var(--font-display)]">
              Acesso Restrito
            </h1>
            <p className="text-arena-smoke text-sm">
              {user
                ? "O teu cargo não tem permissão para aceder a esta página."
                : "Precisas de fazer login para aceder a esta página."}
            </p>
            {!user && (
              <a
                href="/api/auth/twitch"
                className="inline-block mt-4 px-6 py-2 rounded-lg bg-arena-crimson hover:bg-arena-red text-white text-sm transition-all"
              >
                Entrar com Twitch
              </a>
            )}
            {user && (
              <button
                onClick={() => router.push("/")}
                className="mt-4 px-6 py-2 rounded-lg bg-arena-crimson hover:bg-arena-red text-white text-sm transition-all cursor-pointer"
              >
                Voltar ao início
              </button>
            )}
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
}
