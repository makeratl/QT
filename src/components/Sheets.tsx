import { useState } from "react";
import { calc, measureOf, withUnit } from "../lib/calc";
import { BLOCKERS, INTENSITY, TRIGGERS, TYPES, kindOf, type Goal, type Habit, type Intensity, type Log } from "../lib/model";
import { fmtTime, plural } from "../lib/util";
import { useSteady } from "../store";
import { Chips, Glyph, Seg } from "./bits";
import { HabitSub } from "./Settings";
import { todayLogs } from "./Today";

export function Sheets({ habit }: { habit: Habit }) {
  const s = useSteady();
  const close = () => s.setSheet(null);
  const detail = s.sheet === "detail" ? habit.logs.find((l) => l.id === s.detailId) : undefined;
  const edit = s.sheet === "edit" ? s.habits.find((h) => h.id === s.editId) : undefined;
  if (!s.sheet || (s.sheet === "detail" && !detail) || (s.sheet === "edit" && !edit)) return null;

  return (
    <>
      <div className="scrim" onClick={close} />
      <div className="sheet" role="dialog" aria-modal="true">
        <button className="grabber" onClick={close} aria-label="Close">
          <span />
        </button>
        {s.sheet === "switch" && <SwitchSheet />}
        {s.sheet === "moments" && <MomentsSheet habit={habit} />}
        {detail && <DetailSheet key={detail.id} logId={detail.id} habit={habit} />}
        {s.sheet === "slip" && <SlipSheet habit={habit} />}
        {s.sheet === "note" && <NoteSheet />}
        {s.sheet === "entry" && <EntrySheet habit={habit} />}
        {edit && <EditSheet key={edit.id} habit={edit} />}
      </div>
    </>
  );
}

const Head = ({ title, sub }: { title: string; sub?: React.ReactNode }) => (
  <div className="sheet-head" style={{ display: "flex", flexDirection: "column", gap: 4 }}>
    <span className="title">{title}</span>
    {sub && <span className="muted" style={{ font: "600 14px 'Nunito',sans-serif" }}>{sub}</span>}
  </div>
);

const Label = ({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
    <span style={{ font: "800 15px 'Nunito',sans-serif" }}>{children}</span>
    {right && <span className="muted" style={{ font: "600 13px 'Nunito',sans-serif" }}>{right}</span>}
  </div>
);

/** −/+ stepper around a large number, as in onboarding. */
export function Stepper({ value, onChange, min, max, step = 1, caption }: { value: number; onChange: (v: number) => void; min: number; max: number; step?: number; caption: string }) {
  const btn = { width: 52, height: 52, borderRadius: "50%", font: "400 28px/1 'Nunito',sans-serif" } as const;
  const clamp = (v: number) => Math.round(Math.min(max, Math.max(min, v)) * 10) / 10;
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 24 }}>
      <button className="outline" aria-label="Less" onClick={() => onChange(clamp(value - step))} style={btn}>−</button>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 110 }}>
        <span style={{ font: "300 60px/1 'Nunito',sans-serif", letterSpacing: "-0.03em" }}>{value.toLocaleString([], { maximumFractionDigits: 1 })}</span>
        <span className="muted" style={{ font: "700 14px 'Nunito',sans-serif" }}>{caption}</span>
      </div>
      <button className="outline" aria-label="More" onClick={() => onChange(clamp(value + step))} style={btn}>+</button>
    </div>
  );
}

function SwitchSheet() {
  const s = useSteady();
  return (
    <>
      <span className="title sheet-head">What you're working on</span>
      <div className="group">
        {s.habits.map((h) => (
          <button key={h.id} onClick={() => { s.setActiveId(h.id); s.setSheet(null); s.setCalOffset(0); }} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", textAlign: "left" }}>
            <span className={"radio" + (h.id === s.habit?.id ? " on" : "")} />
            <span className="row-text">
              <span className="row-title" style={{ fontSize: 17 }}>{h.name}</span>
              <HabitSub id={h.id} />
            </span>
          </button>
        ))}
      </div>
      <button onClick={s.startOnboarding} style={{ height: 52, borderRadius: 999, boxShadow: "inset 0 0 0 1.5px var(--teal)", color: "var(--teal)", font: "800 15px 'Nunito',sans-serif" }}>
        Add something new
      </button>
    </>
  );
}

export function logLabel(h: Habit, l: Log) {
  return l.type === "entry" ? withUnit(measureOf(h), l.value ?? 1) : TYPES[l.type].label;
}

function MomentsSheet({ habit }: { habit: Habit }) {
  const s = useSteady();
  const logs = todayLogs(habit);
  const track = kindOf(habit) === "track";
  return (
    <>
      <div className="sheet-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span className="title">Today</span>
        <span className="muted" style={{ font: "600 14px 'Nunito',sans-serif" }}>{track ? plural(logs.length, "entry", "entries") : plural(logs.length, "moment")}</span>
      </div>
      {logs.length ? (
        <div className="group">
          {logs.map((l) => {
            const meta = [l.type === "done" && l.value ? plural(l.value, "min", "min") : null, l.trigger, l.intensity ? INTENSITY[l.intensity] : null, l.note].filter(Boolean).join(" · ");
            return (
              <button key={l.id} onClick={() => { s.setDetailId(l.id); s.setSheet("detail"); }} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", textAlign: "left" }}>
                <span className="muted" style={{ width: 54, font: "600 13px 'Nunito',sans-serif", flex: "none" }}>{fmtTime(l.t)}</span>
                <Glyph type={l.type} />
                <span style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 1 }}>
                  <span style={{ font: "700 15px 'Nunito',sans-serif" }}>{logLabel(habit, l)}</span>
                  {meta && <span className="muted" style={{ font: "500 13px 'Nunito',sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{meta}</span>}
                </span>
                {!meta && <span style={{ font: "700 13px 'Nunito',sans-serif", color: "var(--teal)", flex: "none" }}>Add</span>}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="outline muted" style={{ padding: 20, borderRadius: 20, font: "500 15px/1.45 'Nunito',sans-serif", textAlign: "center", textWrap: "pretty" }}>
          {kindOf(habit) === "quit"
            ? "Nothing logged yet today. When a thought or urge shows up, tap to log it — noticing is the work."
            : "Nothing logged yet today. One tap is all it takes."}
        </div>
      )}
    </>
  );
}

function IntensityPicker({ log, onPick, label = "How strong?" }: { log: Log; onPick: (n: Intensity) => void; label?: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <Label right={log.intensity ? INTENSITY[log.intensity] : "Tap a circle"}>{label}</Label>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", height: 56, padding: "0 6px" }}>
        {([1, 2, 3, 4, 5] as Intensity[]).map((n) => {
          const on = !!log.intensity && n <= log.intensity;
          return (
            <button key={n} aria-label={INTENSITY[n]} aria-pressed={log.intensity === n} onClick={() => onPick(n)} style={{ width: 24 + n * 6, height: 24 + n * 6, borderRadius: "50%", background: on ? (n >= 4 ? "var(--clay)" : "var(--teal)") : "transparent", boxShadow: on ? "none" : "inset 0 0 0 1.5px var(--line)", transition: "background .15s" }} />
          );
        })}
      </div>
    </div>
  );
}

function DetailSheet({ logId, habit }: { logId: string; habit: Habit }) {
  const s = useSteady();
  const l = habit.logs.find((x) => x.id === logId)!;
  const patch = (p: Partial<Log>) => s.patchLog(l.id, p);
  const quit = kindOf(habit) === "quit";
  const m = measureOf(habit);

  return (
    <>
      <Head title={logLabel(habit, l)} sub={`${fmtTime(l.t)} · all optional`} />
      {quit && (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Label>What set it off?</Label>
            <Chips options={TRIGGERS} value={l.trigger} onChange={(v) => patch({ trigger: v })} />
          </div>
          <IntensityPicker log={l} onPick={(n) => patch({ intensity: n })} />
        </>
      )}
      {l.type === "done" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <Label right={l.value ? undefined : "Tap + to add"}>How long?</Label>
          <Stepper value={l.value ?? 0} onChange={(v) => patch({ value: v || null })} min={0} max={600} step={5} caption="minutes" />
        </div>
      )}
      {(l.type === "resist" || l.type === "skip") && (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Label>What got in the way?</Label>
            <Chips options={BLOCKERS} value={l.trigger} onChange={(v) => patch({ trigger: v })} />
          </div>
          {l.type === "resist" && <IntensityPicker log={l} onPick={(n) => patch({ intensity: n })} />}
        </>
      )}
      {l.type === "entry" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <Label>Amount</Label>
          <AmountInput value={l.value ?? 1} unit={m.unit} onChange={(v) => v !== null && patch({ value: v })} />
        </div>
      )}
      <textarea className="field" value={l.note} onChange={(e) => patch({ note: e.target.value })} rows={2} placeholder="Anything you want to remember?" style={{ padding: "12px 14px", borderRadius: 16, font: "500 16px/1.4 'Nunito',sans-serif" }} />
      <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 10 }}>
        <button className="btn-outline muted" onClick={() => { s.removeLog(l.id); s.setSheet(null); }}>Remove</button>
        <button className="btn-ink" onClick={() => s.setSheet(null)}>Done</button>
      </div>
    </>
  );
}

/** Free numeric input; keeps its own text so "7." can be typed on the way to "7.5". */
function AmountInput({ value, unit, onChange, autoFocus }: { value: number | null; unit: string; onChange: (v: number | null) => void; autoFocus?: boolean }) {
  const [text, setText] = useState(value === null ? "" : String(value));
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 12, height: 64, padding: "0 18px", borderRadius: 18, boxShadow: "inset 0 0 0 1.5px var(--line)", background: "var(--bg)" }}>
      <input
        autoFocus={autoFocus}
        inputMode="decimal"
        value={text}
        placeholder="0"
        onChange={(e) => {
          const t = e.target.value.replace(",", ".");
          if (!/^\d*\.?\d*$/.test(t)) return;
          setText(t);
          const n = parseFloat(t);
          onChange(Number.isFinite(n) && n > 0 ? n : null);
        }}
        style={{ flex: 1, minWidth: 0, border: "none", outline: "none", background: "transparent", color: "var(--ink)", font: "300 36px 'Nunito',sans-serif", letterSpacing: "-0.02em" }}
      />
      <span className="muted" style={{ font: "700 16px 'Nunito',sans-serif" }}>{unit}</span>
    </label>
  );
}

function EntrySheet({ habit }: { habit: Habit }) {
  const s = useSteady();
  const m = measureOf(habit);
  const [value, setValue] = useState<number | null>(m.mode === "count" ? 2 : null);
  const ok = value !== null && value > 0;
  return (
    <>
      <Head title={m.mode === "count" ? `Add ${m.unit}` : `Log ${habit.name.toLowerCase()}`} sub={m.mode === "count" ? "How many?" : `In ${m.unit}`} />
      {m.mode === "count" ? (
        <Stepper value={value ?? 1} onChange={setValue} min={1} max={999} caption={m.unit} />
      ) : (
        <AmountInput value={null} unit={m.unit} onChange={setValue} autoFocus />
      )}
      <button className="btn-ink" disabled={!ok} style={{ height: 54, opacity: ok ? 1 : 0.4 }} onClick={() => { if (value) { s.addEntry(value); s.setSheet(null); } }}>
        Log it
      </button>
    </>
  );
}

function SlipSheet({ habit }: { habit: Habit }) {
  const s = useSteady();
  const [trigger, setTrigger] = useState<string | null>(null);
  const good = calc(habit).good;
  return (
    <>
      <div className="sheet-head" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <span style={{ font: "300 28px/1.15 'Nunito',sans-serif", textWrap: "balance" }}>That's okay. It happens.</span>
        <span className="muted" style={{ font: "500 15px/1.5 'Nunito',sans-serif", textWrap: "pretty" }}>
          Your streak starts again tomorrow — but the {plural(good, "good day")} you've built don't go anywhere. One moment doesn't undo the work.
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <span style={{ font: "800 15px 'Nunito',sans-serif" }}>
          What led to it? <span className="muted" style={{ fontWeight: 600 }}>Optional</span>
        </span>
        <Chips options={TRIGGERS} value={trigger} onChange={setTrigger} />
      </div>
      <button className="btn-ink" style={{ height: 54 }} onClick={() => { s.log("slip", { trigger }); s.setSheet(null); s.showFlash("Logged. Tomorrow is a fresh day one — and you're not starting from zero."); }}>
        Log it and keep going
      </button>
      <button className="muted" onClick={() => s.setSheet(null)} style={{ height: 40, borderRadius: 999, font: "700 15px 'Nunito',sans-serif", marginTop: -8 }}>
        Not right now
      </button>
    </>
  );
}

function NoteSheet() {
  const s = useSteady();
  const [draft, setDraft] = useState("");
  const ok = !!draft.trim();
  return (
    <>
      <Head title="Write it down" sub="Just for you. How are you feeling right now?" />
      <textarea className="field" autoFocus value={draft} onChange={(e) => setDraft(e.target.value)} rows={5} placeholder="Today felt…" style={{ padding: "14px 16px", borderRadius: 18, font: "500 16px/1.5 'Nunito',sans-serif" }} />
      <button className="btn-ink" disabled={!ok} style={{ height: 54, opacity: ok ? 1 : 0.4 }} onClick={() => { s.log("note", { note: draft.trim() }); s.setSheet(null); s.showFlash("Saved. Writing it down helps."); }}>
        Save note
      </button>
    </>
  );
}

export function GoalPicker({ goal, onChange }: { goal: Goal; onChange: (g: Goal) => void }) {
  return (
    <>
      <Seg<Goal["per"]> options={[["day", "Every day"], ["week", "Times a week"]]} value={goal.per} onChange={(per) => onChange({ per, times: per === "day" ? 1 : Math.max(2, goal.times) })} height={40} />
      {goal.per === "week" && <Stepper value={goal.times} onChange={(times) => onChange({ ...goal, times })} min={1} max={6} caption="times a week" />}
    </>
  );
}

function EditSheet({ habit }: { habit: Habit }) {
  const s = useSteady();
  const [confirm, setConfirm] = useState(false);
  const set = (patch: Partial<Habit>) => s.updateHabitById(habit.id, (h) => ({ ...h, ...patch }));
  const label = { display: "flex", flexDirection: "column", gap: 6 } as const;
  const cap = { font: "700 13px 'Nunito',sans-serif" };
  const k = kindOf(habit);
  const m = measureOf(habit);
  return (
    <>
      <span className="title sheet-head">{k === "track" ? "Edit tracker" : "Edit habit"}</span>
      <label style={label}>
        <span className="muted" style={cap}>Name</span>
        <input className="field" value={habit.name} onChange={(e) => set({ name: e.target.value })} style={{ height: 48, padding: "0 14px", borderRadius: 14, font: "600 16px 'Nunito',sans-serif" }} />
      </label>
      {k === "track" ? (
        <label style={label}>
          <span className="muted" style={cap}>Unit</span>
          <input className="field" value={m.unit} onChange={(e) => set({ measure: { ...m, unit: e.target.value, unitOne: undefined } })} style={{ height: 48, padding: "0 14px", borderRadius: 14, font: "600 16px 'Nunito',sans-serif" }} />
        </label>
      ) : (
        <label style={label}>
          <span className="muted" style={cap}>Why it matters to you</span>
          <textarea className="field" value={habit.why} onChange={(e) => set({ why: e.target.value })} rows={3} placeholder="We'll show this on the hard days." style={{ padding: "12px 14px", borderRadius: 14, font: "500 16px/1.4 'Nunito',sans-serif" }} />
        </label>
      )}
      {k === "build" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <span className="muted" style={cap}>Goal</span>
          <GoalPicker goal={habit.goal ?? { per: "day", times: 1 }} onChange={(goal) => set({ goal })} />
        </div>
      )}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", font: "600 14px 'Nunito',sans-serif" }}>
        <span className="muted">Tracking since</span>
        <span>{new Date(habit.start).toLocaleDateString([], { month: "long", day: "numeric", year: "numeric" })}</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 10 }}>
        <button className="btn-outline" style={{ color: "var(--clay)", fontWeight: 800 }} onClick={() => (confirm ? s.deleteHabit(habit.id) : setConfirm(true))}>
          {confirm ? "Tap to confirm" : "Delete"}
        </button>
        <button className="btn-ink" onClick={() => s.setSheet(null)}>Done</button>
      </div>
    </>
  );
}
