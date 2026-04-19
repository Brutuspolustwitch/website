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
        minHeight: "80px",
      }}>
        {/* Left — Thumbnail */}
        <div style={{ width: "80px", flexShrink: 0, position: "relative" }}>
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
          padding: "8px 12px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: "2px",
          background: "var(--papyrus-base, #e8d9b0)",
        }}>
          <p style={{
            fontFamily: "var(--font-display)",
            fontSize: "0.45rem",
            fontWeight: 700,
            color: label === "Melhor" ? "#2e7d32" : "#8b1a1a",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            marginBottom: "1px",
          }}>{label} Slot</p>
          <p style={{
            fontFamily: "var(--font-ui)",
            fontSize: "0.8rem",
            fontWeight: 700,
            color: "var(--ink-dark, #3a2a14)",
            lineHeight: 1.2,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}>{slotName}</p>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "2px" }}>
            <span style={{
              fontFamily: "var(--font-ui)",
              fontSize: "0.8rem",
              fontWeight: 700,
              color: isWin ? "#2e7d32" : "#8b1a1a",
            }}>{payout.toFixed(2)}{currency}</span>
            <span style={{
              fontFamily: "var(--font-ui)",
              fontSize: "0.65rem",
              fontWeight: 600,
              color: isWin ? "#d4a017" : "#8b1a1a",
            }}>{multi.toFixed(1)}x</span>
          </div>
        </div>
      </div>
    </div>
  );
}
