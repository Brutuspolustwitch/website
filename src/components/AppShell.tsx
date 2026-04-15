"use client";

import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";
import { Footer } from "@/components/Footer";
import { AgeGate } from "@/components/AgeGate";
import { CookieConsent } from "@/components/CookieConsent";
import { AuthProvider } from "@/lib/auth-context";
import PageViewTracker from "@/components/PageViewTracker";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <AuthProvider>
      <PageViewTracker />
      <Navbar onMenuToggle={() => setSidebarOpen((v) => !v)} />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Push content right on desktop to make room for sidebar */}
      <main className="flex-1 lg:pl-56">{children}</main>

      <div className="lg:pl-56">
        <Footer />
      </div>

      <AgeGate />
      <CookieConsent />
    </AuthProvider>
  );
}
