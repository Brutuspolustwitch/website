"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { NAV_LINKS, SITE_NAME } from "@/lib/constants";
import { useAuth } from "@/lib/auth-context";

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const { user, loading, login, logout } = useAuth();

  // Close user menu on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-arena-black/80 backdrop-blur-md border-b border-arena-gold/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <Image
              src="/images/logo.png"
              alt={SITE_NAME}
              width={160}
              height={40}
              className="h-8 w-auto brightness-100 group-hover:brightness-125 transition-all duration-300"
              priority
            />
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="relative px-3 py-2 text-sm font-medium text-arena-smoke hover:text-arena-gold transition-colors duration-300 arena-shine"
              >
                {link.label}
              </Link>
            ))}

            {/* Twitch Auth */}
            {!loading && (
              <div className="ml-3 relative" ref={userMenuRef}>
                {user ? (
                  <>
                    <button
                      onClick={() => setUserMenuOpen(!userMenuOpen)}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-arena-steel/30 hover:border-purple-500/50 transition-all duration-200"
                    >
                      <img
                        src={user.profile_image_url}
                        alt={user.display_name}
                        className="w-6 h-6 rounded-full"
                      />
                      <span className="text-sm font-medium text-arena-white">
                        {user.display_name}
                      </span>
                    </button>
                    <AnimatePresence>
                      {userMenuOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          transition={{ duration: 0.15 }}
                          className="absolute right-0 mt-2 w-48 rounded-lg bg-arena-charcoal border border-arena-steel/30 shadow-xl overflow-hidden z-50"
                        >
                          <div className="px-4 py-3 border-b border-arena-steel/20">
                            <p className="text-sm font-semibold text-arena-white">{user.display_name}</p>
                            <p className="text-xs text-arena-ash">@{user.login}</p>
                          </div>
                          <button
                            onClick={async () => {
                              await logout();
                              setUserMenuOpen(false);
                            }}
                            className="w-full text-left px-4 py-2.5 text-sm text-arena-smoke hover:text-arena-white hover:bg-arena-steel/20 transition-colors"
                          >
                            Sair
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                ) : (
                  <button
                    onClick={login}
                    className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-[#9146FF] hover:bg-[#7c3aed] text-white text-sm font-semibold transition-all duration-200 shadow-sm hover:shadow-purple-500/20"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z" />
                    </svg>
                    Login
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setOpen(!open)}
            className="md:hidden p-2 text-arena-smoke hover:text-arena-gold transition-colors"
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {open ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="md:hidden overflow-hidden bg-arena-charcoal/95 backdrop-blur-md border-b border-arena-gold/10"
          >
            <div className="px-4 py-3 space-y-1">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="block px-3 py-2 text-sm font-medium text-arena-smoke hover:text-arena-gold transition-colors"
                >
                  {link.label}
                </Link>
              ))}

              {/* Mobile auth */}
              {!loading && (
                <div className="pt-3 mt-3 border-t border-arena-steel/20">
                  {user ? (
                    <div className="flex items-center justify-between px-3 py-2">
                      <div className="flex items-center gap-2">
                        <img
                          src={user.profile_image_url}
                          alt={user.display_name}
                          className="w-6 h-6 rounded-full"
                        />
                        <span className="text-sm font-medium text-arena-white">{user.display_name}</span>
                      </div>
                      <button
                        onClick={async () => {
                          await logout();
                          setOpen(false);
                        }}
                        className="text-xs text-arena-ash hover:text-arena-white transition-colors"
                      >
                        Sair
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        login();
                        setOpen(false);
                      }}
                      className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg bg-[#9146FF] hover:bg-[#7c3aed] text-white text-sm font-semibold transition-all"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z" />
                      </svg>
                      Login com Twitch
                    </button>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
