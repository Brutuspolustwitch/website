"use client";

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

  return (
    <div className="papyrus-scroll greek-key-border" style={{ padding: 0 }}>
      <div style={{
        display: "flex",
        alignItems: "stretch",
        gap: 0,
        borderRadius: "6px",
        overflow: "hidden",
        minHeight: "100px",
      }}>
        {/* Left — Thumbnail */}
        <div style={{ width: "100px", flexShrink: 0, position: "relative" }}>
          {thumbnailUrl ? (
            <img
              src={thumbnailUrl}
              alt={slotName}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
          ) : (
            <div style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "var(--papyrus-base, #e8d9b0)",
              fontSize: "1.5rem",
            }}>
              🎰
            </div>
          )}
        </div>

        {/* Right — Info */}
        <div style={{
          flex: 1,
          padding: "8px 14px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: "1px",
          background: "var(--papyrus-base, #e8d9b0)",
        }}>
          {/* Label */}
          <p style={{
            fontFamily: "var(--font-display)",
            fontSize: "0.45rem",
            fontWeight: 700,
            color: label === "Melhor" ? "#2e7d32" : "#8b1a1a",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            marginBottom: "2px",
          }}>{label} Slot</p>

          {/* Slot name */}
          <p style={{
            fontFamily: "var(--font-ui)",
            fontSize: "0.85rem",
            fontWeight: 700,
            color: "var(--ink-dark, #3a2a14)",
            lineHeight: 1.2,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            marginBottom: "4px",
          }}>{slotName}</p>

          {/* Payout */}
          <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
            <span style={{ fontFamily: "var(--font-display)", fontSize: "0.4rem", color: "var(--ink-light)", letterSpacing: "0.12em", textTransform: "uppercase" }}>Payout</span>
            <span style={{ fontFamily: "var(--font-ui)", fontSize: "0.75rem", fontWeight: 700, color: isWin ? "#2e7d32" : "#8b1a1a" }}>{payout.toFixed(2)}{currency}</span>
          </div>

          {/* Bet Size */}
          <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
            <span style={{ fontFamily: "var(--font-display)", fontSize: "0.4rem", color: "var(--ink-light)", letterSpacing: "0.12em", textTransform: "uppercase" }}>Bet Size</span>
            <span style={{ fontFamily: "var(--font-ui)", fontSize: "0.75rem", fontWeight: 600, color: "var(--ink-dark, #3a2a14)" }}>{betValue.toFixed(2)}{currency}</span>
          </div>

          {/* Multi */}
          <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
            <span style={{ fontFamily: "var(--font-display)", fontSize: "0.4rem", color: "var(--ink-light)", letterSpacing: "0.12em", textTransform: "uppercase" }}>Multi</span>
            <span style={{ fontFamily: "var(--font-ui)", fontSize: "0.75rem", fontWeight: 700, color: isWin ? "#d4a017" : "#8b1a1a" }}>{multi.toFixed(1)}x</span>
          </div>
        </div>
      </div>
    </div>
  );
}
