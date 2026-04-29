import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../lib/auth";
import { allocByType, getAssets, performanceSeries, totals } from "../lib/store";
import { fmtMoney, fmtPct } from "../lib/format";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Cell,
} from "recharts";

const COLORS = ["#1A362D", "#C25946", "#D4A373", "#7B8C7A", "#E2D8CE", "#2C4F44"];

const Analytics = () => {
  const { session } = useAuth();
  const uid = session.user.id;
  const [assets, setAssets] = useState([]);

  useEffect(() => setAssets(getAssets(uid)), [uid]);

  const t = useMemo(() => totals(assets), [assets]);
  const series = useMemo(() => performanceSeries(assets), [assets]);
  const alloc = useMemo(() => allocByType(assets), [assets]);

  const byAsset = useMemo(() => {
    return [...assets]
      .map((a) => ({
        name: a.ticker,
        gain: a.quantity * (a.currentPrice - a.costBasis),
        ret: a.costBasis > 0 ? (a.currentPrice - a.costBasis) / a.costBasis : 0,
      }))
      .sort((a, b) => b.gain - a.gain);
  }, [assets]);

  const winners = byAsset.filter((x) => x.gain > 0).slice(0, 4);
  const losers = byAsset.filter((x) => x.gain < 0).slice(-4).reverse();

  return (
    <div className="max-w-[1400px] mx-auto" data-testid="analytics-page">
      <div className="mb-8">
        <div className="overline">Insights</div>
        <h1 className="font-heading text-4xl sm:text-5xl mt-2 font-medium tracking-tight">Analytics.</h1>
        <p className="text-sm text-[#6B6A65] mt-2 max-w-xl">
          Performance of every position, and the long arc of the whole portfolio.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="rounded-xl bg-white border border-[#E6E5E1] p-5">
          <div className="overline">Portfolio value</div>
          <div className="font-mono-data text-2xl mt-1">{fmtMoney(t.value, { compact: true })}</div>
        </div>
        <div className="rounded-xl bg-white border border-[#E6E5E1] p-5">
          <div className="overline">Cost basis</div>
          <div className="font-mono-data text-2xl mt-1">{fmtMoney(t.cost, { compact: true })}</div>
        </div>
        <div className="rounded-xl bg-white border border-[#E6E5E1] p-5">
          <div className="overline">Gain / loss</div>
          <div className={`font-mono-data text-2xl mt-1 ${t.gain >= 0 ? "text-[#3C6E47]" : "text-[#B94A48]"}`}>
            {fmtMoney(t.gain, { compact: true, sign: true })}
          </div>
        </div>
        <div className="rounded-xl bg-white border border-[#E6E5E1] p-5">
          <div className="overline">Total return</div>
          <div className={`font-mono-data text-2xl mt-1 ${t.ret >= 0 ? "text-[#3C6E47]" : "text-[#B94A48]"}`}>
            {fmtPct(t.ret)}
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-white border border-[#E6E5E1] p-6 sm:p-8 card-shadow mb-6">
        <div className="flex items-end justify-between mb-5">
          <div>
            <div className="overline">12-Month performance</div>
            <div className="font-heading text-xl font-medium">Portfolio vs benchmark</div>
          </div>
        </div>
        <div className="h-80">
          <ResponsiveContainer>
            <LineChart data={series} margin={{ left: 0, right: 8, top: 6, bottom: 0 }}>
              <CartesianGrid stroke="#E6E5E1" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: "#6B6A65", fontSize: 11, fontFamily: "IBM Plex Mono" }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={(v) => fmtMoney(v, { compact: true })} tick={{ fill: "#6B6A65", fontSize: 11, fontFamily: "IBM Plex Mono" }} axisLine={false} tickLine={false} width={70} />
              <Tooltip
                formatter={(v) => fmtMoney(v, { compact: true })}
                contentStyle={{ borderRadius: 8, border: "1px solid #E6E5E1", fontFamily: "IBM Plex Mono", fontSize: 12 }}
              />
              <Line type="monotone" dataKey="value" stroke="#1A362D" strokeWidth={2.5} dot={false} activeDot={{ r: 5, stroke: "#1A362D", fill: "#fff" }} />
              <Line type="monotone" dataKey="benchmark" stroke="#C25946" strokeWidth={2} strokeDasharray="5 4" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-3 flex items-center gap-6 text-xs">
          <div className="flex items-center gap-2"><span className="h-1 w-6 bg-[#1A362D] rounded" /> <span>Portfolio</span></div>
          <div className="flex items-center gap-2"><span className="h-0.5 w-6 bg-[#C25946] rounded" /> <span>Benchmark</span></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
        <div className="lg:col-span-2 rounded-xl bg-white border border-[#E6E5E1] p-6 sm:p-8 card-shadow">
          <div className="overline">Gain / loss by asset</div>
          <div className="font-heading text-xl font-medium mb-4">Position contribution</div>
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={byAsset} margin={{ left: 0, right: 8, top: 6, bottom: 0 }}>
                <CartesianGrid stroke="#E6E5E1" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: "#6B6A65", fontSize: 11, fontFamily: "IBM Plex Mono" }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(v) => fmtMoney(v, { compact: true })} tick={{ fill: "#6B6A65", fontSize: 11, fontFamily: "IBM Plex Mono" }} axisLine={false} tickLine={false} width={70} />
                <Tooltip
                  formatter={(v) => fmtMoney(v, { compact: true })}
                  contentStyle={{ borderRadius: 8, border: "1px solid #E6E5E1", fontFamily: "IBM Plex Mono", fontSize: 12 }}
                />
                <Bar dataKey="gain" radius={[6, 6, 0, 0]}>
                  {byAsset.map((d, i) => (
                    <Cell key={i} fill={d.gain >= 0 ? "#1A362D" : "#C25946"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl bg-white border border-[#E6E5E1] p-6 sm:p-8 card-shadow">
          <div className="overline">Allocation</div>
          <div className="font-heading text-xl font-medium mb-4">By asset class</div>
          <div className="space-y-4">
            {alloc.map((a, i) => {
              const pct = (a.value / (t.value || 1)) * 100;
              return (
                <div key={a.name}>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-sm" style={{ background: COLORS[i % COLORS.length] }} />
                      <span>{a.name}</span>
                    </div>
                    <span className="font-mono-data text-[#6B6A65]">{pct.toFixed(1)}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[#F3F3F1] overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${pct}%`, background: COLORS[i % COLORS.length] }}
                    />
                  </div>
                </div>
              );
            })}
            {alloc.length === 0 && <div className="text-sm text-[#9D9C96]">No allocation data.</div>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="rounded-xl bg-white border border-[#E6E5E1] p-6 sm:p-8 card-shadow">
          <div className="overline">Top winners</div>
          <div className="font-heading text-xl font-medium mb-4">Best contributors</div>
          <div className="space-y-3">
            {winners.length === 0 && <div className="text-sm text-[#9D9C96]">Nothing in the green yet.</div>}
            {winners.map((w) => (
              <div key={w.name} className="flex items-center justify-between border-b border-[#E6E5E1] pb-3 last:border-0">
                <div className="font-mono-data">{w.name}</div>
                <div className="text-right">
                  <div className="font-mono-data text-[#3C6E47]">{fmtMoney(w.gain, { compact: true, sign: true })}</div>
                  <div className="font-mono-data text-[11px] text-[#9D9C96]">{fmtPct(w.ret)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl bg-white border border-[#E6E5E1] p-6 sm:p-8 card-shadow">
          <div className="overline">Top losers</div>
          <div className="font-heading text-xl font-medium mb-4">Largest drag</div>
          <div className="space-y-3">
            {losers.length === 0 && <div className="text-sm text-[#9D9C96]">No losses — well done.</div>}
            {losers.map((w) => (
              <div key={w.name} className="flex items-center justify-between border-b border-[#E6E5E1] pb-3 last:border-0">
                <div className="font-mono-data">{w.name}</div>
                <div className="text-right">
                  <div className="font-mono-data text-[#B94A48]">{fmtMoney(w.gain, { compact: true, sign: true })}</div>
                  <div className="font-mono-data text-[11px] text-[#9D9C96]">{fmtPct(w.ret)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
