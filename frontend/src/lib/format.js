export const fmtMoney = (n, opts = {}) => {
  const { compact = false, sign = false } = opts;
  if (n === null || n === undefined || isNaN(n)) return "—";
  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: compact ? "compact" : "standard",
    maximumFractionDigits: compact ? 1 : 2,
  });
  const out = formatter.format(Math.abs(n));
  if (sign) return `${n >= 0 ? "+" : "−"}${out}`;
  return n < 0 ? `−${out}` : out;
};

export const fmtPct = (n, sign = true) => {
  if (n === null || n === undefined || isNaN(n)) return "—";
  const s = (n * 100).toFixed(2) + "%";
  if (!sign) return s;
  return n >= 0 ? `+${s}` : `−${(Math.abs(n) * 100).toFixed(2)}%`;
};

export const fmtNum = (n, dp = 4) => {
  if (n === null || n === undefined || isNaN(n)) return "—";
  return Number(n).toLocaleString("en-US", { maximumFractionDigits: dp });
};
