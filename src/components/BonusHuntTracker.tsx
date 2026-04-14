"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArenaCard } from "@/components/ui/ArenaCard";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { STAGGER_CONTAINER, STAGGER_ITEM, TRANSITION_HEAVY } from "@/lib/animations";
import type { BonusHuntSlot } from "@/lib/supabase";

/**
 * BONUS HUNT TRACKER — Real-time updating slot card carousel.
 *
 * Architecture:
 * - Cards animate in from bottom (gladiator entering arena)
 * - Position changes interpolate smoothly via layout animations
 * - 3D depth via perspective and rotateX transforms
 * - Supabase real-time subscription for live updates
 *
 * For demo, uses mock data. Production: wire to Supabase channel.
 */

// Demo data — in production, fetched from Supabase
const MOCK_SLOTS: BonusHuntSlot[] = [
  { id: "1", name: "Gates of Olympus", buy_value: 500, potential_multiplier: 5000, status: "active", order_index: 0, session_id: "s1", created_at: "" },
  { id: "2", name: "Sweet Bonanza", buy_value: 250, potential_multiplier: 2000, status: "pending", order_index: 1, session_id: "s1", created_at: "" },
  { id: "3", name: "Wanted Dead or Wild", buy_value: 1000, potential_multiplier: 10000, status: "pending", order_index: 2, session_id: "s1", created_at: "" },
  { id: "4", name: "Book of Dead", buy_value: 100, potential_multiplier: 5000, status: "completed", result: 850, order_index: 3, session_id: "s1", created_at: "" },
  { id: "5", name: "Fruit Party 2", buy_value: 400, potential_multiplier: 3000, status: "pending", order_index: 4, session_id: "s1", created_at: "" },
  { id: "6", name: "Mental", buy_value: 200, potential_multiplier: 8000, status: "pending", order_index: 5, session_id: "s1", created_at: "" },
];

export function BonusHuntTracker() {
  const [slots, setSlots] = useState<BonusHuntSlot[]>(MOCK_SLOTS);
  const [totalBuy, setTotalBuy] = useState(0);
  const [totalResult, setTotalResult] = useState(0);

  useEffect(() => {
    setTotalBuy(slots.reduce((sum, s) => sum + s.buy_value, 0));
    setTotalResult(
      slots
        .filter((s) => s.status === "completed" && s.result)
        .reduce((sum, s) => sum + (s.result ?? 0), 0)
    );
  }, [slots]);

  const statusColor = {
    pending: "text-arena-smoke",
    active: "text-green-400",
    completed: "text-arena-gold",
  };

  const statusLabel = {
    pending: "Awaiting",
    active: "⚔️ IN BATTLE",
    completed: "✓ Conquered",
  };

  return (
    <section id="bonus-hunt" className="relative py-20 px-4 sm:px-6 lg:px-8 bg-arena-dark/50 overflow-hidden">
      {/* Background texture */}
      <div
        className="absolute inset-0 opacity-[0.06] bg-cover bg-right-bottom pointer-events-none"
        style={{ backgroundImage: "url('/images/pages/warrior-illustration.jpg')" }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-arena-dark via-arena-dark/85 to-arena-dark/70 pointer-events-none" />
      <div className="relative max-w-7xl mx-auto">
        <ScrollReveal>
          <SectionHeading
            title="Bonus Hunt"
            subtitle="Track every bonus in real-time. Watch as the gladiator conquers each slot."
          />
        </ScrollReveal>

        {/* Stats bar */}
        <ScrollReveal delay={0.1}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
            {[
              { label: "Slots", value: slots.length },
              { label: "Total Buy", value: `€${totalBuy.toLocaleString("en-US")}` },
              { label: "Total Result", value: `€${totalResult.toLocaleString("en-US")}` },
              {
                label: "Profit",
                value: `€${(totalResult - totalBuy).toLocaleString("en-US")}`,
                color: totalResult >= totalBuy ? "text-green-400" : "text-arena-red",
              },
            ].map((stat) => (
              <ArenaCard key={stat.label} className="p-4 text-center">
                <p className="text-xs text-arena-ash uppercase tracking-wider font-[family-name:var(--font-display)]">
                  {stat.label}
                </p>
                <p className={`text-2xl font-bold mt-1 ${stat.color ?? "text-arena-white"}`}>
                  {stat.value}
                </p>
              </ArenaCard>
            ))}
          </div>
        </ScrollReveal>

        {/* Card grid with 3D depth carousel */}
        <motion.div
          variants={STAGGER_CONTAINER}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          style={{ perspective: "1200px" }}
        >
          <AnimatePresence mode="popLayout">
            {slots.map((slot, i) => (
              <motion.div
                key={slot.id}
                variants={STAGGER_ITEM}
                layout // Smooth position interpolation — no teleporting
                exit={{ opacity: 0, y: 60, scale: 0.9 }}
                style={{
                  transformStyle: "preserve-3d",
                }}
                whileHover={{
                  rotateX: -3,
                  rotateY: 2,
                  scale: 1.03,
                  transition: { type: "spring", stiffness: 200, damping: 15 },
                }}
              >
                <ArenaCard
                  variant={slot.status === "active" ? "crimson" : "default"}
                  className={`p-5 ${slot.status === "active" ? "metal-frame-glow" : ""}`}
                >
                  {/* Slot header */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <span className="text-xs text-arena-ash font-[family-name:var(--font-display)] tracking-wider">
                        #{i + 1}
                      </span>
                      <h3 className="font-[family-name:var(--font-display)] text-lg font-bold text-arena-white mt-1">
                        {slot.name}
                      </h3>
                    </div>
                    <span className={`text-xs font-bold tracking-wider uppercase ${statusColor[slot.status]}`}>
                      {statusLabel[slot.status]}
                    </span>
                  </div>

                  {/* Slot stats */}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-arena-ash">Buy Value</span>
                      <span className="text-arena-white font-bold">€{slot.buy_value}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-arena-ash">Max Win</span>
                      <span className="text-arena-gold font-bold">
                        {slot.potential_multiplier.toLocaleString("en-US")}x
                      </span>
                    </div>
                    {slot.status === "completed" && slot.result !== undefined && (
                      <div className="flex justify-between pt-2 border-t border-arena-steel/20">
                        <span className="text-arena-ash">Result</span>
                        <span
                          className={`font-bold ${
                            slot.result >= slot.buy_value ? "text-green-400" : "text-arena-red"
                          }`}
                        >
                          €{slot.result.toLocaleString("en-US")}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Active indicator bar */}
                  {slot.status === "active" && (
                    <motion.div
                      className="mt-4 h-1 progress-gold-fill"
                      initial={{ width: 0 }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 2, ease: "easeInOut" }}
                    />
                  )}
                </ArenaCard>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}
