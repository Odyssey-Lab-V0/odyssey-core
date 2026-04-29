import { useEffect, useState } from "react";
import { useAuth } from "../lib/auth";
import { deleteGoal, getGoals, upsertGoal } from "../lib/store";
import { fmtMoney } from "../lib/format";
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
import { Plus, Target, PencilSimple, Trash } from "@phosphor-icons/react";
import { toast } from "sonner";

const inputCls =
  "w-full h-10 rounded-md border border-[#E6E5E1] bg-white px-3 text-sm outline-none focus:border-[#1A362D] focus:ring-2 focus:ring-[#1A362D]/15";

const CATEGORIES = ["Retirement", "Real Estate", "Education", "Travel", "Safety", "Other"];
const empty = { id: "", name: "", target: 100000, current: 0, deadline: "2030-01-01", category: "Retirement" };

const GoalDialog = ({ open, onOpenChange, initial, onSave }) => {
  const [form, setForm] = useState(empty);
  useEffect(() => setForm(initial || empty), [initial, open]);
  const upd = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const submit = (e) => {
    e.preventDefault();
    if (!form.name) return toast.error("Goal name is required.");
    onSave({
      ...form,
      target: Number(form.target),
      current: Number(form.current),
    });
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white max-w-lg" data-testid="goal-dialog">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl">{form.id ? "Edit goal" : "New goal"}</DialogTitle>
          <DialogDescription className="text-[#6B6A65]">Define a target, a deadline, and where you stand.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4 mt-2">
          <label className="block">
            <div className="overline mb-1.5">Goal name</div>
            <input className={inputCls} value={form.name} onChange={(e) => upd("name", e.target.value)} placeholder="Retirement Nest Egg" data-testid="goal-name-input" required />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <div className="overline mb-1.5">Category</div>
              <Select value={form.category} onValueChange={(v) => upd("category", v)}>
                <SelectTrigger className="h-10 rounded-md border-[#E6E5E1]" data-testid="goal-category-select"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </label>
            <label className="block">
              <div className="overline mb-1.5">Deadline</div>
              <input type="date" className={inputCls + " font-mono-data"} value={form.deadline} onChange={(e) => upd("deadline", e.target.value)} data-testid="goal-deadline-input" required />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <div className="overline mb-1.5">Current amount</div>
              <input type="number" min="0" step="any" className={inputCls + " font-mono-data"} value={form.current} onChange={(e) => upd("current", e.target.value)} data-testid="goal-current-input" required />
            </label>
            <label className="block">
              <div className="overline mb-1.5">Target amount</div>
              <input type="number" min="0" step="any" className={inputCls + " font-mono-data"} value={form.target} onChange={(e) => upd("target", e.target.value)} data-testid="goal-target-input" required />
            </label>
          </div>
          <DialogFooter className="pt-2">
            <button type="button" onClick={() => onOpenChange(false)} className="h-10 px-4 rounded-md border border-[#E6E5E1] bg-white text-sm hover:bg-[#F3F3F1]">Cancel</button>
            <button type="submit" data-testid="goal-save-button" className="h-10 px-4 rounded-md bg-[#1A362D] text-[#F9F9F8] text-sm font-medium hover:bg-[#2C4F44]">Save</button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const Goals = () => {
  const { session } = useAuth();
  const uid = session.user.id;
  const [goals, setGoals] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  useEffect(() => setGoals(getGoals(uid)), [uid]);

  const save = (g) => {
    upsertGoal(uid, g);
    setGoals(getGoals(uid));
    setOpen(false);
    toast.success("Goal saved.");
  };
  const remove = (id) => {
    if (!window.confirm("Delete this goal?")) return;
    deleteGoal(uid, id);
    setGoals(getGoals(uid));
    toast.success("Goal removed.");
  };

  return (
    <div className="max-w-[1400px] mx-auto" data-testid="goals-page">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
        <div>
          <div className="overline">Long horizon</div>
          <h1 className="font-heading text-4xl sm:text-5xl mt-2 font-medium tracking-tight">Goals.</h1>
          <p className="text-sm text-[#6B6A65] mt-2 max-w-xl">
            Set the destination, then let compounding do the work.
          </p>
        </div>
        <button
          onClick={() => { setEditing(null); setOpen(true); }}
          className="inline-flex items-center gap-2 rounded-lg bg-[#1A362D] text-[#F9F9F8] px-4 h-11 text-sm hover:bg-[#2C4F44] transition active:scale-[0.99]"
          data-testid="add-goal-button"
        >
          <Plus size={16} weight="bold" /> New goal
        </button>
      </div>

      {goals.length === 0 ? (
        <div className="rounded-xl bg-white border border-[#E6E5E1] py-20 text-center">
          <Target size={56} weight="light" className="mx-auto text-[#9D9C96]" />
          <div className="mt-4 font-heading text-xl">No goals yet</div>
          <div className="text-sm text-[#6B6A65] mt-1">Define your first wealth target.</div>
          <button
            onClick={() => { setEditing(null); setOpen(true); }}
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#1A362D] text-[#F9F9F8] px-4 h-10 text-sm hover:bg-[#2C4F44]"
          >
            <Plus size={16} /> New goal
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 stagger" data-testid="goals-grid">
          {goals.map((g) => {
            const pct = Math.min(100, (g.current / g.target) * 100);
            const remain = Math.max(0, g.target - g.current);
            const days = Math.max(0, Math.round((new Date(g.deadline) - Date.now()) / (1000 * 60 * 60 * 24)));
            return (
              <div key={g.id} className="rounded-xl bg-white border border-[#E6E5E1] p-6 card-shadow hover:-translate-y-[2px] transition" data-testid={`goal-card-${g.id}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="overline">{g.category}</div>
                    <div className="font-heading text-xl mt-1 font-medium">{g.name}</div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => { setEditing(g); setOpen(true); }} className="p-2 rounded-md hover:bg-[#ECEBE7]" aria-label="Edit"><PencilSimple size={16} className="text-[#6B6A65]" /></button>
                    <button onClick={() => remove(g.id)} className="p-2 rounded-md hover:bg-[#ECEBE7]" aria-label="Delete"><Trash size={16} className="text-[#B94A48]" /></button>
                  </div>
                </div>
                <div className="mt-5">
                  <div className="flex items-baseline justify-between mb-2">
                    <div>
                      <div className="font-heading text-3xl font-mono-data tracking-tight">{fmtMoney(g.current, { compact: true })}</div>
                      <div className="text-xs text-[#6B6A65] mt-0.5">of {fmtMoney(g.target, { compact: true })}</div>
                    </div>
                    <div className="font-mono-data text-sm text-[#1A362D]">{pct.toFixed(0)}%</div>
                  </div>
                  <div className="h-2 rounded-full bg-[#F3F3F1] overflow-hidden">
                    <div className="h-full rounded-full bg-[#1A362D]" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="mt-4 flex items-center justify-between text-xs font-mono-data text-[#6B6A65]">
                    <span>{fmtMoney(remain, { compact: true })} to go</span>
                    <span>{days}d remaining · {g.deadline}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <GoalDialog open={open} onOpenChange={setOpen} initial={editing} onSave={save} />
    </div>
  );
};

export default Goals;
