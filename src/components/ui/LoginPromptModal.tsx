"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface LoginPromptModalProps {
  /** Whether the modal is visible */
  open: boolean;
  /** Called when the user dismisses (clicks backdrop or ✕). If omitted the modal is not dismissible. */
  onClose?: () => void;
  /** Optional short description shown below the headline */
  description?: string;
}

/**
 * Full-screen login prompt modal.
 * Renders as a portal-less fixed overlay (z-[9999]) so it works inside any stacking context.
 * Redirects to /api/auth/twitch when the CTA is clicked.
 */
export function LoginPromptModal({ open, onClose, description }: LoginPromptModalProps) {
  /* Lock body scroll while open */
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  /* Close on Escape */
  useEffect(() => {
    if (!open || !onClose) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="login-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          style={{ backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)", background: "rgba(0,0,0,0.65)" }}
          onClick={onClose}
        >
          <motion.div
            key="login-card"
            initial={{ opacity: 0, scale: 0.88, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.88, y: 24 }}
            transition={{ type: "spring", stiffness: 340, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            className="relative mx-4 w-full max-w-sm rounded-2xl border border-arena-gold/30 bg-arena-dark shadow-[0_0_60px_rgba(212,168,67,0.15)]"
            style={{ background: "linear-gradient(160deg, #1a1410 0%, #120e0a 100%)" }}
          >
            {/* Dismiss button */}
            {onClose && (
              <button
                onClick={onClose}
                className="absolute right-3 top-3 text-arena-ash/40 hover:text-arena-ash transition-colors text-lg leading-none"
                aria-label="Fechar"
              >
                ✕
              </button>
            )}

            <div className="flex flex-col items-center gap-5 px-8 py-10">
              {/* Twitch wordmark / logo */}
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#9147ff]/15 border border-[#9147ff]/30">
                <svg viewBox="0 0 24 24" className="h-8 w-8 fill-[#9147ff]" xmlns="http://www.w3.org/2000/svg">
                  <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z" />
                </svg>
              </div>

              <div className="text-center">
                <h2
                  className="text-xl font-black tracking-wider text-arena-gold uppercase"
                  style={{ fontFamily: "var(--font-display, 'Cinzel', serif)" }}
                >
                  Inicia Sessão
                </h2>
                <p className="mt-2 text-sm text-arena-ash/70 leading-relaxed">
                  {description ?? "Liga a tua conta Twitch para participar."}
                </p>
              </div>

              <a
                href="/api/auth/twitch"
                className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-[#9147ff] px-6 py-3 text-sm font-bold text-white transition-all duration-200 hover:bg-[#7d3be8] hover:shadow-[0_0_24px_rgba(145,71,255,0.4)] active:scale-95"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4 fill-white" xmlns="http://www.w3.org/2000/svg">
                  <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z" />
                </svg>
                Entrar com Twitch
              </a>

              <p className="text-[10px] text-arena-ash/30 text-center leading-relaxed">
                O início de sessão é feito através da Twitch.<br />Não armazenamos passwords.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
