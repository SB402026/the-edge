// ─── SHARED STYLES ────────────────────────────────────────────────────────────
export const S = {
  pageBg:"#F7F5F0", cardBg:"#FFFFFF", cardBorder:"#E2DDD5", subBg:"#F0EDE8",
  textPrimary:"#1A1815", textSecondary:"#5A5650", textMuted:"#8C8880",
  green:"#1a5c36", greenLight:"#EBF5EE", greenMid:"#2E7D4F",
  bestBg:"#1a5c36", bestText:"#FFFFFF",
  betBg:"#EBF5EE",  betText:"#1a5c36",  betBorder:"#2E7D4F",
  leanBg:"#FEF8EC", leanText:"#7A5200", leanBorder:"#D4A017",
  passBg:"#F5F5F5", passText:"#888888", passBorder:"#D0D0D0",
  blue:"#1A56A0",   blueBg:"#E8F0FB",
  red:"#8B1A1A",    redLight:"#FFF0F0", redBorder:"#C0392B",
};

// ─── BUTTON STYLE HELPER ──────────────────────────────────────────────────────
export function btn(primary, sm, disabled) {
  return {
    fontSize: sm ? 12 : 13,
    padding: sm ? "5px 10px" : "7px 14px",
    borderRadius: 7,
    cursor: disabled ? "not-allowed" : "pointer",
    fontWeight: 600,
    border: "none",
    opacity: disabled ? 0.6 : 1,
    background: primary ? S.green : S.cardBg,
    color: primary ? "#fff" : S.textPrimary,
    ...(primary ? {} : { border: `1px solid ${S.cardBorder}` }),
  };
}
