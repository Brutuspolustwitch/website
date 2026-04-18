"use client";

import { useState, useEffect } from "react";

interface SlotHighlightCardProps {
  label: string;          // "MELHOR" or "PIOR"
  slotName: string;
  thumbnailUrl?: string;
  payout: number;
  betValue: number;
  currency?: string;
}

export function SlotHighlightCard({
  label,
  slotName,
  thumbnailUrl,
  payout,
  betValue,
  currency = "€",
}: SlotHighlightCardProps) {
  const multi = betValue > 0 ? payout / betValue : 0;
  const isWin = payout >= betValue;

  // Slow continuous spin
  const [rotation, setRotation] = useState(0);
  useEffect(() => {
    let frame: number;
    let lastTime = performance.now();
    const speed = 18; // degrees per second

    function tick(now: number) {
      const dt = (now - lastTime) / 1000;
      lastTime = now;
      setRotation((r) => (r + speed * dt) % 360);
      frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div className="slot-highlight-card" style={{ perspective: "600px" }}>
      {/* Label */}
      <p className="slot-highlight-label">{label}</p>

      {/* Spinning container */}
      <div
        className="slot-highlight-flipper"
        style={{ transform: `rotateY(${rotation}deg)` }}
      >
        {/* FRONT — Slot image */}
        <div className="slot-highlight-face slot-highlight-front">
          <div className="papyrus-scroll greek-key-border" style={{ padding: 0, height: "100%" }}>
            <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden", borderRadius: "6px" }}>
              {thumbnailUrl ? (
                <img
                  src={thumbnailUrl}
                  alt={slotName}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <div style={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "var(--papyrus-base, #e8d9b0)",
                  fontFamily: "var(--font-display)",
                  fontSize: "0.55rem",
                  color: "var(--ink-light)",
                  textAlign: "center",
                  padding: "8px",
                  letterSpacing: "0.05em",
                }}>
                  {slotName}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* BACK — Payout info */}
        <div className="slot-highlight-face slot-highlight-back">
          <div className="papyrus-scroll greek-key-border" style={{ padding: 0, height: "100%" }}>
            <div style={{
              width: "100%",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "3px",
              padding: "6px 4px",
              background: "var(--papyrus-base, #e8d9b0)",
              borderRadius: "6px",
            }}>
              <span style={{
                fontFamily: "var(--font-display)",
                fontSize: "0.4rem",
                color: "var(--ink-light)",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
              }}>Payout</span>
              <span style={{
                fontFamily: "var(--font-ui)",
                fontSize: "0.75rem",
                fontWeight: 700,
                color: isWin ? "#2e7d32" : "#8b1a1a",
              }}>{payout.toFixed(2)}{currency}</span>

              <span style={{
                fontFamily: "var(--font-display)",
                fontSize: "0.4rem",
                color: "var(--ink-light)",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                marginTop: "2px",
              }}>Bet</span>
              <span style={{
                fontFamily: "var(--font-ui)",
                fontSize: "0.6rem",
                fontWeight: 600,
                color: "var(--ink-dark, #3a2a14)",
              }}>{betValue.toFixed(2)}{currency}</span>

              <span style={{
                fontFamily: "var(--font-display)",
                fontSize: "0.4rem",
                color: "var(--ink-light)",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                marginTop: "2px",
              }}>Multi</span>
              <span style={{
                fontFamily: "var(--font-ui)",
                fontSize: "0.7rem",
                fontWeight: 700,
                color: isWin ? "#d4a017" : "#8b1a1a",
              }}>{multi.toFixed(1)}x</span>
            </div>
          </div>
        </div>
      </div>

      {/* Slot name underneath */}
      <p className="slot-highlight-name">{slotName}</p>
    </div>
  );
}
