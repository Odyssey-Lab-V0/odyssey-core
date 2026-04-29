// Simple per-user localStorage store for assets, transactions, goals.
const k = (userId, kind) => `wm_${kind}_${userId}`;

const seedAssets = () => [
  { id: crypto.randomUUID(), name: "Apple Inc.", ticker: "AAPL", type: "Stocks", quantity: 50, costBasis: 145, currentPrice: 188.4, currency: "USD", createdAt: Date.now() - 86400000 * 240 },
  { id: crypto.randomUUID(), name: "Vanguard S&P 500 ETF", ticker: "VOO", type: "Stocks", quantity: 30, costBasis: 380, currentPrice: 462.1, currency: "USD", createdAt: Date.now() - 86400000 * 200 },
  { id: crypto.randomUUID(), name: "US Treasury 10Y", ticker: "UST10Y", type: "Bonds", quantity: 100, costBasis: 98, currentPrice: 101.5, currency: "USD", createdAt: Date.now() - 86400000 * 180 },
  { id: crypto.randomUUID(), name: "Bitcoin", ticker: "BTC", type: "Crypto", quantity: 0.75, costBasis: 32000, currentPrice: 64200, currency: "USD", createdAt: Date.now() - 86400000 * 160 },
  { id: crypto.randomUUID(), name: "Ethereum", ticker: "ETH", type: "Crypto", quantity: 6, costBasis: 1900, currentPrice: 3120, currency: "USD", createdAt: Date.now() - 86400000 * 140 },
  { id: crypto.randomUUID(), name: "Brooklyn Loft", ticker: "RE-BK", type: "Real Estate", quantity: 1, costBasis: 620000, currentPrice: 765000, currency: "USD", createdAt: Date.now() - 86400000 * 800 },
  { id: crypto.randomUUID(), name: "High-Yield Savings", ticker: "HYSA", type: "Cash", quantity: 1, costBasis: 42000, currentPrice: 42850, currency: "USD", createdAt: Date.now() - 86400000 * 30 },
];

const seedTxs = (assets) => {
  const out = [];
  assets.forEach((a, i) => {
    out.push({
      id: crypto.randomUUID(),
      assetId: a.id,
      assetName: a.name,
      ticker: a.ticker,
      side: "buy",
      quantity: a.quantity,
      price: a.costBasis,
      total: a.quantity * a.costBasis,
      date: new Date(a.createdAt).toISOString().slice(0, 10),
      note: "Initial purchase",
    });
    if (i < 3) {
      out.push({
        id: crypto.randomUUID(),
        assetId: a.id,
        assetName: a.name,
        ticker: a.ticker,
        side: "buy",
        quantity: Math.max(1, Math.round(a.quantity * 0.2)),
        price: a.currentPrice * 0.92,
        total: Math.max(1, Math.round(a.quantity * 0.2)) * a.currentPrice * 0.92,
        date: new Date(Date.now() - 86400000 * 60).toISOString().slice(0, 10),
        note: "Top-up",
      });
    }
  });
  return out;
};

const seedGoals = () => [
  { id: crypto.randomUUID(), name: "Retirement Nest Egg", target: 1500000, current: 612000, deadline: "2040-01-01", category: "Retirement" },
  { id: crypto.randomUUID(), name: "Tuscany Villa", target: 850000, current: 220000, deadline: "2030-06-01", category: "Real Estate" },
  { id: crypto.randomUUID(), name: "Emergency Fund (12 mo)", target: 60000, current: 42850, deadline: "2026-12-31", category: "Safety" },
];

export const initUserData = (userId) => {
  if (!localStorage.getItem(k(userId, "assets"))) {
    const assets = seedAssets();
    localStorage.setItem(k(userId, "assets"), JSON.stringify(assets));
    localStorage.setItem(k(userId, "txs"), JSON.stringify(seedTxs(assets)));
    localStorage.setItem(k(userId, "goals"), JSON.stringify(seedGoals()));
  }
};

const get = (userId, kind) => JSON.parse(localStorage.getItem(k(userId, kind)) || "[]");
const set = (userId, kind, v) => localStorage.setItem(k(userId, kind), JSON.stringify(v));

export const getAssets = (uid) => get(uid, "assets");
export const getTxs = (uid) => get(uid, "txs");
export const getGoals = (uid) => get(uid, "goals");

export const upsertAsset = (uid, asset) => {
  const list = getAssets(uid);
  const idx = list.findIndex((a) => a.id === asset.id);
  if (idx >= 0) list[idx] = asset;
  else list.push({ ...asset, id: crypto.randomUUID(), createdAt: Date.now() });
  set(uid, "assets", list);
  return list;
};
export const deleteAsset = (uid, id) => {
  set(uid, "assets", getAssets(uid).filter((a) => a.id !== id));
  set(uid, "txs", getTxs(uid).filter((t) => t.assetId !== id));
};

export const addTx = (uid, tx) => {
  const list = getTxs(uid);
  list.push({ ...tx, id: crypto.randomUUID() });
  set(uid, "txs", list);
  // adjust asset quantity
  const assets = getAssets(uid);
  const a = assets.find((x) => x.id === tx.assetId);
  if (a) {
    const delta = tx.side === "buy" ? tx.quantity : -tx.quantity;
    a.quantity = Math.max(0, a.quantity + delta);
    set(uid, "assets", assets);
  }
  return list;
};
export const deleteTx = (uid, id) => set(uid, "txs", getTxs(uid).filter((t) => t.id !== id));

export const upsertGoal = (uid, goal) => {
  const list = getGoals(uid);
  const idx = list.findIndex((g) => g.id === goal.id);
  if (idx >= 0) list[idx] = goal;
  else list.push({ ...goal, id: crypto.randomUUID() });
  set(uid, "goals", list);
  return list;
};
export const deleteGoal = (uid, id) =>
  set(uid, "goals", getGoals(uid).filter((g) => g.id !== id));

// derived
export const totals = (assets) => {
  const value = assets.reduce((s, a) => s + a.quantity * a.currentPrice, 0);
  const cost = assets.reduce((s, a) => s + a.quantity * a.costBasis, 0);
  const gain = value - cost;
  const ret = cost > 0 ? gain / cost : 0;
  return { value, cost, gain, ret };
};

export const allocByType = (assets) => {
  const map = {};
  assets.forEach((a) => {
    const v = a.quantity * a.currentPrice;
    map[a.type] = (map[a.type] || 0) + v;
  });
  return Object.entries(map).map(([name, value]) => ({ name, value }));
};

// Synthetic 12-month performance series anchored to current value
export const performanceSeries = (assets) => {
  const { value } = totals(assets);
  const months = ["Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb"];
  const drift = [0.84, 0.88, 0.86, 0.9, 0.93, 0.91, 0.95, 0.97, 0.94, 0.98, 1.0, 1.0];
  return months.map((m, i) => ({
    month: m,
    value: Math.round(value * drift[i]),
    benchmark: Math.round(value * (drift[i] * 0.94)),
  }));
};

export const ASSET_TYPES = ["Stocks", "Bonds", "Real Estate", "Crypto", "Cash"];
