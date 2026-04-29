import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../lib/auth";
import { addTx, deleteTx, getAssets, getTxs } from "../lib/store";
import { fmtMoney, fmtNum } from "../lib/format";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Plus, Trash, ArrowsLeftRight } from "@phosphor-icons/react";
import { toast } from "sonner";

const inputCls =
  "w-full h-10 rounded-md border border-[#E6E5E1] bg-white px-3 text-sm outline-none focus:border-[#1A362D] focus:ring-2 focus:ring-[#1A362D]/15";

const TxDialog = ({ open, onOpenChange, assets, onSave }) => {
  const [side, setSide] = useState("buy");
  const [assetId, setAssetId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState(0);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");

  useEffect(() => {
    if (open) {
      setAssetId(assets[0]?.id || "");
      setSide("buy");
      setQuantity(1);
      setPrice(assets[0]?.currentPrice || 0);
      setDate(new Date().toISOString().slice(0, 10));
      setNote("");
    }
  }, [open, assets]);

  const submit = (e) => {
    e.preventDefault();
    const a = assets.find((x) => x.id === assetId);
    if (!a) return toast.error("Pick an asset.");
    const q = Number(quantity);
    const p = Number(price);
    onSave({
      assetId,
      assetName: a.name,
      ticker: a.ticker,
      side,
      quantity: q,
      price: p,
      total: q * p,
      date,
      note,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white max-w-lg" data-testid="transaction-dialog">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl">Record transaction</DialogTitle>
          <DialogDescription className="text-[#6B6A65]">
            Buy/sell entries adjust your asset quantity automatically.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <div className="overline mb-1.5">Side</div>
              <Select value={side} onValueChange={setSide}>
                <SelectTrigger className="h-10 rounded-md border-[#E6E5E1]" data-testid="tx-side">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="buy">Buy</SelectItem>
                  <SelectItem value="sell">Sell</SelectItem>
                </SelectContent>
              </Select>
            </label>
            <label className="block">
              <div className="overline mb-1.5">Asset</div>
              <Select value={assetId} onValueChange={setAssetId}>
                <SelectTrigger className="h-10 rounded-md border-[#E6E5E1]" data-testid="tx-asset">
                  <SelectValue placeholder="Select asset" />
                </SelectTrigger>
                <SelectContent>
                  {assets.map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.name} · {a.ticker}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <label className="block">
              <div className="overline mb-1.5">Quantity</div>
              <input type="number" step="any" min="0" required className={inputCls + " font-mono-data"} value={quantity} onChange={(e) => setQuantity(e.target.value)} data-testid="tx-quantity" />
            </label>
            <label className="block">
              <div className="overline mb-1.5">Price</div>
              <input type="number" step="any" min="0" required className={inputCls + " font-mono-data"} value={price} onChange={(e) => setPrice(e.target.value)} data-testid="tx-price" />
            </label>
            <label className="block">
              <div className="overline mb-1.5">Date</div>
              <input type="date" required className={inputCls + " font-mono-data"} value={date} onChange={(e) => setDate(e.target.value)} data-testid="tx-date" />
            </label>
          </div>
          <label className="block">
            <div className="overline mb-1.5">Note</div>
            <input className={inputCls} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional" data-testid="tx-note" />
          </label>
          <div className="rounded-md border border-[#E6E5E1] bg-[#F9F9F8] px-4 py-3 flex items-center justify-between">
            <span className="overline">Total</span>
            <span className="font-mono-data text-base">{fmtMoney((Number(quantity) || 0) * (Number(price) || 0))}</span>
          </div>
          <DialogFooter className="pt-2">
            <button type="button" onClick={() => onOpenChange(false)} className="h-10 px-4 rounded-md border border-[#E6E5E1] bg-white text-sm hover:bg-[#F3F3F1]">Cancel</button>
            <button type="submit" data-testid="tx-save-button" className="h-10 px-4 rounded-md bg-[#1A362D] text-[#F9F9F8] text-sm font-medium hover:bg-[#2C4F44]">Record</button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const Transactions = () => {
  const { session } = useAuth();
  const uid = session.user.id;
  const [txs, setTxs] = useState([]);
  const [assets, setAssets] = useState([]);
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    setAssets(getAssets(uid));
    setTxs(getTxs(uid));
  }, [uid]);

  const filtered = useMemo(() => {
    const sorted = [...txs].sort((a, b) => (b.date > a.date ? 1 : -1));
    if (filter === "all") return sorted;
    return sorted.filter((t) => t.side === filter);
  }, [txs, filter]);

  const totals = useMemo(() => {
    let buy = 0, sell = 0;
    txs.forEach((t) => {
      if (t.side === "buy") buy += t.total;
      else sell += t.total;
    });
    return { buy, sell, net: sell - buy };
  }, [txs]);

  const save = (tx) => {
    addTx(uid, tx);
    setTxs(getTxs(uid));
    setAssets(getAssets(uid));
    setOpen(false);
    toast.success("Transaction recorded.");
  };

  const remove = (id) => {
    if (!window.confirm("Delete this transaction?")) return;
    deleteTx(uid, id);
    setTxs(getTxs(uid));
    toast.success("Transaction deleted.");
  };

  return (
    <div className="max-w-[1400px] mx-auto" data-testid="transactions-page">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
        <div>
          <div className="overline">Ledger</div>
          <h1 className="font-heading text-4xl sm:text-5xl mt-2 font-medium tracking-tight">Transactions.</h1>
          <p className="text-sm text-[#6B6A65] mt-2 max-w-xl">
            Every buy and sell, with the math kept honest.
          </p>
        </div>
        <button
          onClick={() => setOpen(true)}
          disabled={assets.length === 0}
          className="inline-flex items-center gap-2 rounded-lg bg-[#1A362D] text-[#F9F9F8] px-4 h-11 text-sm hover:bg-[#2C4F44] transition disabled:opacity-50"
          data-testid="add-transaction-button"
        >
          <Plus size={16} weight="bold" /> New transaction
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="rounded-xl bg-white border border-[#E6E5E1] px-5 py-4">
          <div className="overline">Total bought</div>
          <div className="font-mono-data text-2xl mt-1">{fmtMoney(totals.buy, { compact: true })}</div>
        </div>
        <div className="rounded-xl bg-white border border-[#E6E5E1] px-5 py-4">
          <div className="overline">Total sold</div>
          <div className="font-mono-data text-2xl mt-1">{fmtMoney(totals.sell, { compact: true })}</div>
        </div>
        <div className="rounded-xl bg-white border border-[#E6E5E1] px-5 py-4">
          <div className="overline">Net flow</div>
          <div className={`font-mono-data text-2xl mt-1 ${totals.net >= 0 ? "text-[#3C6E47]" : "text-[#B94A48]"}`}>
            {fmtMoney(totals.net, { compact: true, sign: true })}
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-white border border-[#E6E5E1] card-shadow overflow-hidden">
        <div className="flex items-center gap-3 p-4 border-b border-[#E6E5E1]">
          {["all", "buy", "sell"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-xs font-mono-data uppercase tracking-wider px-3 py-1.5 rounded-md transition ${
                filter === f ? "bg-[#1A362D] text-[#F9F9F8]" : "text-[#6B6A65] hover:bg-[#F3F3F1]"
              }`}
              data-testid={`tx-filter-${f}`}
            >
              {f}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="py-20 text-center">
            <ArrowsLeftRight size={56} weight="light" className="mx-auto text-[#9D9C96]" />
            <div className="mt-4 font-heading text-xl">No transactions</div>
            <div className="text-sm text-[#6B6A65] mt-1">Add an asset, then record a transaction.</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" data-testid="tx-table">
              <thead>
                <tr className="text-left text-[#9D9C96] bg-[#F9F9F8]">
                  <th className="overline px-5 py-3 font-normal">Date</th>
                  <th className="overline px-5 py-3 font-normal">Asset</th>
                  <th className="overline px-5 py-3 font-normal">Side</th>
                  <th className="overline px-5 py-3 font-normal text-right">Qty</th>
                  <th className="overline px-5 py-3 font-normal text-right">Price</th>
                  <th className="overline px-5 py-3 font-normal text-right">Total</th>
                  <th className="overline px-5 py-3 font-normal">Note</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => (
                  <tr key={t.id} className="border-t border-[#E6E5E1] hover:bg-[#F9F9F8]">
                    <td className="px-5 py-3.5 font-mono-data text-[#6B6A65]">{t.date}</td>
                    <td className="px-5 py-3.5">
                      <div className="font-medium">{t.assetName}</div>
                      <div className="text-[11px] font-mono-data text-[#9D9C96]">{t.ticker}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs font-mono-data uppercase px-2 py-0.5 rounded ${
                        t.side === "buy" ? "bg-[#E8EDE8] text-[#3C6E47]" : "bg-[#F3DDD7] text-[#A64A39]"
                      }`}>
                        {t.side}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono-data">{fmtNum(t.quantity)}</td>
                    <td className="px-5 py-3.5 text-right font-mono-data">{fmtMoney(t.price, { compact: true })}</td>
                    <td className="px-5 py-3.5 text-right font-mono-data font-medium">{fmtMoney(t.total, { compact: true })}</td>
                    <td className="px-5 py-3.5 text-[#6B6A65] truncate max-w-[160px]">{t.note || "—"}</td>
                    <td className="px-5 py-3.5 text-right">
                      <button onClick={() => remove(t.id)} className="p-2 rounded-md hover:bg-[#ECEBE7]" aria-label="Delete">
                        <Trash size={16} className="text-[#B94A48]" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <TxDialog open={open} onOpenChange={setOpen} assets={assets} onSave={save} />
    </div>
  );
};

export default Transactions;
