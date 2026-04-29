import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../lib/auth";
import {
  getAssets,
  getTxs,
  getGoals,
  totals,
  allocByType,
  performanceSeries,
} from "../lib/store";
import { fmtMoney, fmtPct } from "../lib/format";
import KPICard from "../components/KPICard";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { ArrowUpRight, ArrowDownRight, Plus } from "@phosphor-icons/react";
import { Link } from "react-router-dom";

const CHART_COLORS = ["#1A362D", "#C25946", "#D4A373", "#7B8C7A", "#E2D8CE", "#2C4F44"];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-[#E6E5E1] bg-white px-3 py-2 card-shadow-lg">
      <div className="overline mb-1">{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-2 text-xs font-mono-data">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
          <span className="capitalize text-[#6B6A65]">{p.dataKey}</span>
          <span className="text-[#1C1C19]">{fmtMoney(p.value, { compact: true })}</span>
        </div>
      ))}
    </div>
  );
};

const Dashboard = () => {
  const { session } = useAuth();
  const uid = session.user.id;
  const [assets, setAssets] = useState([]);
  const [txs, setTxs] = useState([]);
  const [goals, setGoals] = useState([]);

  useEffect(() => {
    setAssets(getAssets(uid));
    setTxs(getTxs(uid));
    setGoals(getGoals(uid));
  }, [uid]);

  const t = useMemo(() => totals(assets), [assets]);
  const series = useMemo(() => performanceSeries(assets), [assets]);
  const alloc = useMemo(() => allocByType(assets), [assets]);
  const topHoldings = useMemo(
    () =>
      [...assets]
        .map((a) => ({ ...a, marketValue: a.quantity * a.currentPrice }))
        .sort((a, b) => b.marketValue - a.marketValue)
        .slice(0, 5),
    [assets]
  );

  const recent = txs.slice(-5).reverse();
  const liquidity = assets.filter((a) => ["Cash", "Stocks"].includes(a.type)).reduce((s, a) => s + a.quantity * a.currentPrice, 0);
  const goalsProgress = goals.length
    ? goals.reduce((s, g) => s + Math.min(1, g.current / g.target), 0) / goals.length
    : 0;

  return (
    <div className="max-w-[1400px] mx-auto" data-testid="dashboard-page">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
        <div>
          <div className="overline">Overview · {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</div>
          <h1 className="font-heading text-4xl sm:text-5xl mt-2 font-medium tracking-tight">
            Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"}, {session.user.name?.split(" ")[0] || "there"}.
          </h1>
        </div>
        <Link
          to="/assets"
          className="inline-flex items-center gap-2 rounded-lg border border-[#E6E5E1] bg-white px-4 h-11 text-sm hover:bg-[#F3F3F1] transition self-start"
          data-testid="dashboard-add-asset-cta"
        >
          <Plus size={16} /> Add asset
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 stagger">
        <KPICard
          accent
          label="Net Worth"
          value={<span data-testid="portfolio-net-worth-value" className="font-mono-data">{fmtMoney(t.value, { compact: true })}</span>}
          delta={t.ret}
          deltaLabel={fmtPct(t.ret)}
          testid="kpi-net-worth"
        />
        <KPICard
          label="Total Gains"
          value={<span className="font-mono-data" style={{ color: t.gain >= 0 ? "#3C6E47" : "#B94A48" }}>{fmtMoney(t.gain, { compact: true, sign: true })}</span>}
          testid="kpi-gains"
        />
        <KPICard
          label="Liquid Assets"
          value={<span className="font-mono-data">{fmtMoney(liquidity, { compact: true })}</span>}
          testid="kpi-liquid"
        />
        <KPICard
          label="Goals Progress"
          value={<span className="font-mono-data">{(goalsProgress * 100).toFixed(0)}%</span>}
          testid="kpi-goals"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-5">
        <div className="lg:col-span-2 rounded-xl bg-white border border-[#E6E5E1] p-6 sm:p-8 card-shadow" data-testid="performance-card">
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="overline">Performance · 12M</div>
              <div className="font-heading text-2xl mt-1 font-medium font-mono-data">{fmtMoney(t.value)}</div>
            </div>
            <div className="text-right">
              <div className="overline">Δ vs benchmark</div>
              <div className="font-mono-data text-sm mt-1 text-[#3C6E47]">+6.4%</div>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer>
              <AreaChart data={series} margin={{ left: 0, right: 8, top: 6, bottom: 0 }}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1A362D" stopOpacity={0.18} />
                    <stop offset="100%" stopColor="#1A362D" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#E6E5E1" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: "#6B6A65", fontSize: 11, fontFamily: "IBM Plex Mono" }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(v) => fmtMoney(v, { compact: true })} tick={{ fill: "#6B6A65", fontSize: 11, fontFamily: "IBM Plex Mono" }} axisLine={false} tickLine={false} width={70} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="benchmark" stroke="#9D9C96" strokeDasharray="4 4" fill="transparent" strokeWidth={1.5} />
                <Area type="monotone" dataKey="value" stroke="#1A362D" fill="url(#g1)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl bg-white border border-[#E6E5E1] p-6 sm:p-8 card-shadow" data-testid="allocation-card">
          <div className="overline mb-1">Allocation</div>
          <div className="font-heading text-xl font-medium">By asset class</div>
          <div className="h-56 mt-4">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={alloc} dataKey="value" nameKey="name" innerRadius={48} outerRadius={80} paddingAngle={2} stroke="#fff">
                  {alloc.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v) => fmtMoney(v, { compact: true })}
                  contentStyle={{ borderRadius: 8, border: "1px solid #E6E5E1", fontFamily: "IBM Plex Mono", fontSize: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 space-y-2">
            {alloc.map((a, i) => (
              <div key={a.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-sm" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                  <span>{a.name}</span>
                </div>
                <span className="font-mono-data text-[#6B6A65]">
                  {((a.value / (t.value || 1)) * 100).toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-5">
        <div className="lg:col-span-2 rounded-xl bg-white border border-[#E6E5E1] p-6 sm:p-8 card-shadow">
          <div className="flex items-end justify-between mb-5">
            <div>
              <div className="overline">Top Holdings</div>
              <div className="font-heading text-xl font-medium">By market value</div>
            </div>
            <Link to="/assets" className="text-sm text-[#1A362D] underline underline-offset-4">View all</Link>
          </div>
          <table className="w-full text-sm" data-testid="top-holdings-table">
            <thead>
              <tr className="text-left text-[#9D9C96]">
                <th className="overline pb-3 font-normal">Asset</th>
                <th className="overline pb-3 font-normal">Type</th>
                <th className="overline pb-3 font-normal text-right">Qty</th>
                <th className="overline pb-3 font-normal text-right">Value</th>
                <th className="overline pb-3 font-normal text-right">Return</th>
              </tr>
            </thead>
            <tbody>
              {topHoldings.map((h) => {
                const ret = h.costBasis > 0 ? (h.currentPrice - h.costBasis) / h.costBasis : 0;
                return (
                  <tr key={h.id} className="border-t border-[#E6E5E1]">
                    <td className="py-3.5">
                      <div className="font-medium">{h.name}</div>
                      <div className="text-[11px] font-mono-data text-[#9D9C96]">{h.ticker}</div>
                    </td>
                    <td className="py-3.5 text-[#6B6A65]">{h.type}</td>
                    <td className="py-3.5 text-right font-mono-data">{h.quantity}</td>
                    <td className="py-3.5 text-right font-mono-data">{fmtMoney(h.marketValue, { compact: true })}</td>
                    <td className={`py-3.5 text-right font-mono-data ${ret >= 0 ? "text-[#3C6E47]" : "text-[#B94A48]"}`}>{fmtPct(ret)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="rounded-xl bg-white border border-[#E6E5E1] p-6 sm:p-8 card-shadow">
          <div className="overline mb-1">Recent activity</div>
          <div className="font-heading text-xl font-medium">Transactions</div>
          <div className="mt-5 divide-y divide-[#E6E5E1]" data-testid="recent-transactions-list">
            {recent.length === 0 && (
              <div className="text-sm text-[#9D9C96]">No recent transactions.</div>
            )}
            {recent.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between py-3.5">
                <div>
                  <div className="text-sm font-medium">{tx.assetName}</div>
                  <div className="text-[11px] font-mono-data text-[#9D9C96]">{tx.date} · {tx.side.toUpperCase()}</div>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-mono-data ${tx.side === "buy" ? "text-[#1C1C19]" : "text-[#C25946]"}`}>
                    {tx.side === "buy" ? "−" : "+"}{fmtMoney(tx.total, { compact: true })}
                  </div>
                  <div className="text-[11px] font-mono-data text-[#9D9C96]">
                    {tx.quantity} @ {fmtMoney(tx.price, { compact: true })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
