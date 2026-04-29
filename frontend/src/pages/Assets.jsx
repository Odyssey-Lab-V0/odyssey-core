import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../lib/auth";
import {
  ASSET_TYPES,
  deleteAsset,
  getAssets,
  totals,
  upsertAsset,
} from "../lib/store";
import { fmtMoney, fmtPct, fmtNum } from "../lib/format";
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
import { Plus, PencilSimple, Trash, MagnifyingGlass, Vault } from "@phosphor-icons/react";
import { toast } from "sonner";

const empty = {
  id: "",
  name: "",
  ticker: "",
  type: "Stocks",
  quantity: 1,
  costBasis: 0,
  currentPrice: 0,
  currency: "USD",
};

const Field = ({ label, children }) => (
  <label className="block">
    <div className="overline mb-1.5">{label}</div>
    {children}
  </label>
);

const inputCls =
  "w-full h-10 rounded-md border border-[#E6E5E1] bg-white px-3 text-sm outline-none focus:border-[#1A362D] focus:ring-2 focus:ring-[#1A362D]/15 transition";

const AssetDialog = ({ open, onOpenChange, initial, onSave }) => {
  const [form, setForm] = useState(empty);
  useEffect(() => {
    setForm(initial || empty);
  }, [initial, open]);
  const upd = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const submit = (e) => {
    e.preventDefault();
    if (!form.name || !form.ticker) return toast.error("Name and ticker are required.");
    onSave({
      ...form,
      quantity: Number(form.quantity),
      costBasis: Number(form.costBasis),
      currentPrice: Number(form.currentPrice),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white max-w-lg" data-testid="asset-dialog">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl">
            {form.id ? "Edit asset" : "Add an asset"}
          </DialogTitle>
          <DialogDescription className="text-[#6B6A65]">
            Manually enter holdings and pricing. All values store locally.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Name">
              <input className={inputCls} value={form.name} onChange={(e) => upd("name", e.target.value)} placeholder="Apple Inc." data-testid="asset-name-input" required />
            </Field>
            <Field label="Ticker / ID">
              <input className={inputCls} value={form.ticker} onChange={(e) => upd("ticker", e.target.value.toUpperCase())} placeholder="AAPL" data-testid="asset-ticker-input" required />
            </Field>
          </div>
          <Field label="Type">
            <Select value={form.type} onValueChange={(v) => upd("type", v)}>
              <SelectTrigger className="h-10 rounded-md border-[#E6E5E1]" data-testid="asset-type-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ASSET_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Quantity">
              <input type="number" step="any" min="0" className={inputCls + " font-mono-data"} value={form.quantity} onChange={(e) => upd("quantity", e.target.value)} data-testid="asset-quantity-input" required />
            </Field>
            <Field label="Cost / unit">
              <input type="number" step="any" min="0" className={inputCls + " font-mono-data"} value={form.costBasis} onChange={(e) => upd("costBasis", e.target.value)} data-testid="asset-cost-input" required />
            </Field>
            <Field label="Current price">
              <input type="number" step="any" min="0" className={inputCls + " font-mono-data"} value={form.currentPrice} onChange={(e) => upd("currentPrice", e.target.value)} data-testid="asset-price-input" required />
            </Field>
          </div>
          <DialogFooter className="pt-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="h-10 px-4 rounded-md border border-[#E6E5E1] bg-white text-sm hover:bg-[#F3F3F1]"
            >
              Cancel
            </button>
            <button
              type="submit"
              data-testid="asset-save-button"
              className="h-10 px-4 rounded-md bg-[#1A362D] text-[#F9F9F8] text-sm font-medium hover:bg-[#2C4F44]"
            >
              {form.id ? "Save changes" : "Add asset"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const Assets = () => {
  const { session } = useAuth();
  const uid = session.user.id;
  const [assets, setAssets] = useState([]);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("All");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  useEffect(() => setAssets(getAssets(uid)), [uid]);

  const t = useMemo(() => totals(assets), [assets]);

  const filtered = useMemo(() => {
    return assets.filter((a) => {
      if (filter !== "All" && a.type !== filter) return false;
      if (q && !(a.name.toLowerCase().includes(q.toLowerCase()) || a.ticker.toLowerCase().includes(q.toLowerCase()))) return false;
      return true;
    });
  }, [assets, q, filter]);

  const save = (asset) => {
    upsertAsset(uid, asset);
    setAssets(getAssets(uid));
    setOpen(false);
    toast.success(asset.id ? "Asset updated." : "Asset added.");
  };
  const remove = (id) => {
    if (!window.confirm("Delete this asset and its transactions?")) return;
    deleteAsset(uid, id);
    setAssets(getAssets(uid));
    toast.success("Asset removed.");
  };

  return (
    <div className="max-w-[1400px] mx-auto" data-testid="assets-page">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
        <div>
          <div className="overline">Holdings</div>
          <h1 className="font-heading text-4xl sm:text-5xl mt-2 font-medium tracking-tight">Assets.</h1>
          <p className="text-sm text-[#6B6A65] mt-2 max-w-xl">
            All your stocks, bonds, real estate, crypto, and cash — measured against their cost basis.
          </p>
        </div>
        <button
          onClick={() => { setEditing(null); setOpen(true); }}
          className="inline-flex items-center gap-2 rounded-lg bg-[#1A362D] text-[#F9F9F8] px-4 h-11 text-sm hover:bg-[#2C4F44] transition active:scale-[0.99]"
          data-testid="add-asset-button"
        >
          <Plus size={16} weight="bold" /> Add asset
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="rounded-xl bg-white border border-[#E6E5E1] px-5 py-4">
          <div className="overline">Holdings</div>
          <div className="font-mono-data text-2xl mt-1">{assets.length}</div>
        </div>
        <div className="rounded-xl bg-white border border-[#E6E5E1] px-5 py-4">
          <div className="overline">Market value</div>
          <div className="font-mono-data text-2xl mt-1">{fmtMoney(t.value, { compact: true })}</div>
        </div>
        <div className="rounded-xl bg-white border border-[#E6E5E1] px-5 py-4">
          <div className="overline">Cost basis</div>
          <div className="font-mono-data text-2xl mt-1">{fmtMoney(t.cost, { compact: true })}</div>
        </div>
        <div className="rounded-xl bg-white border border-[#E6E5E1] px-5 py-4">
          <div className="overline">Unrealized P/L</div>
          <div className={`font-mono-data text-2xl mt-1 ${t.gain >= 0 ? "text-[#3C6E47]" : "text-[#B94A48]"}`}>
            {fmtMoney(t.gain, { compact: true, sign: true })}
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-white border border-[#E6E5E1] card-shadow overflow-hidden">
        <div className="flex flex-col sm:flex-row gap-3 p-4 border-b border-[#E6E5E1]">
          <div className="relative flex-1">
            <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9D9C96]" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by name or ticker"
              className="w-full h-10 rounded-md border border-[#E6E5E1] bg-[#F9F9F8] pl-9 pr-3 text-sm outline-none focus:border-[#1A362D]"
              data-testid="asset-search"
            />
          </div>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="h-10 sm:w-44 rounded-md border-[#E6E5E1]" data-testid="asset-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All types</SelectItem>
              {ASSET_TYPES.map((t) => (<SelectItem key={t} value={t}>{t}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>

        {filtered.length === 0 ? (
          <div className="py-20 text-center">
            <Vault size={56} weight="light" className="mx-auto text-[#9D9C96]" />
            <div className="mt-4 font-heading text-xl">No assets yet</div>
            <div className="text-sm text-[#6B6A65] mt-1">Add your first holding to begin.</div>
            <button onClick={() => { setEditing(null); setOpen(true); }} className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#1A362D] text-[#F9F9F8] px-4 h-10 text-sm hover:bg-[#2C4F44]">
              <Plus size={16} /> Add asset
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" data-testid="assets-table">
              <thead>
                <tr className="text-left text-[#9D9C96] bg-[#F9F9F8]">
                  <th className="overline px-5 py-3 font-normal">Asset</th>
                  <th className="overline px-5 py-3 font-normal">Type</th>
                  <th className="overline px-5 py-3 font-normal text-right">Quantity</th>
                  <th className="overline px-5 py-3 font-normal text-right">Cost</th>
                  <th className="overline px-5 py-3 font-normal text-right">Price</th>
                  <th className="overline px-5 py-3 font-normal text-right">Market Value</th>
                  <th className="overline px-5 py-3 font-normal text-right">Return</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a) => {
                  const mv = a.quantity * a.currentPrice;
                  const ret = a.costBasis > 0 ? (a.currentPrice - a.costBasis) / a.costBasis : 0;
                  return (
                    <tr key={a.id} className="border-t border-[#E6E5E1] hover:bg-[#F9F9F8]" data-testid={`asset-row-${a.ticker}`}>
                      <td className="px-5 py-3.5">
                        <div className="font-medium">{a.name}</div>
                        <div className="text-[11px] font-mono-data text-[#9D9C96]">{a.ticker}</div>
                      </td>
                      <td className="px-5 py-3.5 text-[#6B6A65]">{a.type}</td>
                      <td className="px-5 py-3.5 text-right font-mono-data">{fmtNum(a.quantity)}</td>
                      <td className="px-5 py-3.5 text-right font-mono-data text-[#6B6A65]">{fmtMoney(a.costBasis, { compact: true })}</td>
                      <td className="px-5 py-3.5 text-right font-mono-data">{fmtMoney(a.currentPrice, { compact: true })}</td>
                      <td className="px-5 py-3.5 text-right font-mono-data font-medium">{fmtMoney(mv, { compact: true })}</td>
                      <td className={`px-5 py-3.5 text-right font-mono-data ${ret >= 0 ? "text-[#3C6E47]" : "text-[#B94A48]"}`}>{fmtPct(ret)}</td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => { setEditing(a); setOpen(true); }}
                            className="p-2 rounded-md hover:bg-[#ECEBE7]"
                            data-testid={`asset-edit-${a.ticker}`}
                            aria-label="Edit"
                          >
                            <PencilSimple size={16} className="text-[#6B6A65]" />
                          </button>
                          <button
                            onClick={() => remove(a.id)}
                            className="p-2 rounded-md hover:bg-[#ECEBE7]"
                            data-testid={`asset-delete-${a.ticker}`}
                            aria-label="Delete"
                          >
                            <Trash size={16} className="text-[#B94A48]" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AssetDialog open={open} onOpenChange={setOpen} initial={editing} onSave={save} />
    </div>
  );
};

export default Assets;
