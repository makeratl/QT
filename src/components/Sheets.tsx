import { useState } from "react";
import { calc } from "../lib/calc";
import { INTENSITY, TRIGGERS, TYPES, type Habit, type Intensity } from "../lib/model";
import { fmtTime, plural } from "../lib/util";
import { useSteady } from "../store";
import { Chips, Glyph } from "./bits";
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
        Add something to quit
      </button>
    </>
  );
}

function MomentsSheet({ habit }: { habit: Habit }) {
  const s = useSteady();
  const logs = todayLogs(habit);
  return (
    <>
      <div className="sheet-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span className="title">Today</span>
        <span className="muted" style={{ font: "600 14px 'Nunito',sans-serif" }}>{plural(logs.length, "moment")}</span>
      </div>
      {logs.length ? (
        <div className="group">
          {logs.map((l) => {
            const meta = [l.trigger, l.intensity ? INTENSITY[l.intensity] : null, l.note].filter(Boolean).join(" · ");
            return (
              <button key={l.id} onClick={() => { s.setDetailId(l.id); s.setSheet("detail"); }} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", textAlign: "left" }}>
                <span className="muted" style={{ width: 54, font: "600 13px 'Nunito',sans-serif", flex: "none" }}>{fmtTime(l.t)}</span>
                <Glyph type={l.type} />
                <span style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 1 }}>
                  <span style={{ font: "700 15px 'Nunito',sans-serif" }}>{TYPES[l.type].label}</span>
                  {meta && <span className="muted" style={{ font: "500 13px 'Nunito',sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{meta}</span>}
                </span>
                {!meta && <span style={{ font: "700 13px 'Nunito',sans-serif", color: "var(--teal)", flex: "none" }}>Add</span>}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="outline muted" style={{ padding: 20, borderRadius: 20, font: "500 15px/1.45 'Nunito',sans-serif", textAlign: "center", textWrap: "pretty" }}>
          Nothing logged yet today. When a thought or urge shows up, tap to log it — noticing is the work.
        </div>
      )}
    </>
  );
}

function DetailSheet({ logId, habit }: { logId: string; habit: Habit }) {
  const s = useSteady();
  const l = habit.logs.find((x) => x.id === logId)!;
  return (
    <>
      <Head title={TYPES[l.type].label} sub={`${fmtTime(l.t)} · all optional`} />
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <span style={{ font: "800 15px 'Nunito',sans-serif" }}>What set it off?</span>
        <Chips options={TRIGGERS} value={l.trigger} onChange={(v) => s.patchLog(l.id, { trigger: v })} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <span style={{ font: "800 15px 'Nunito',sans-serif" }}>How strong?</span>
          <span className="muted" style={{ font: "600 13px 'Nunito',sans-serif" }}>{l.intensity ? INTENSITY[l.intensity] : "Tap a circle"}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", height: 56, padding: "0 6px" }}>
          {([1, 2, 3, 4, 5] as Intensity[]).map((n) => {
            const on = !!l.intensity && n <= l.intensity;
            return (
              <button key={n} aria-label={INTENSITY[n]} aria-pressed={l.intensity === n} onClick={() => s.patchLog(l.id, { intensity: n })} style={{ width: 24 + n * 6, height: 24 + n * 6, borderRadius: "50%", background: on ? (n >= 4 ? "var(--clay)" : "var(--teal)") : "transparent", boxShadow: on ? "none" : "inset 0 0 0 1.5px var(--line)", transition: "background .15s" }} />
            );
          })}
        </div>
      </div>
      <textarea className="field" value={l.note} onChange={(e) => s.patchLog(l.id, { note: e.target.value })} rows={2} placeholder="Anything you want to remember?" style={{ padding: "12px 14px", borderRadius: 16, font: "500 16px/1.4 'Nunito',sans-serif" }} />
      <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 10 }}>
        <button className="btn-outline muted" onClick={() => { s.removeLog(l.id); s.setSheet(null); }}>Remove</button>
        <button className="btn-ink" onClick={() => s.setSheet(null)}>Done</button>
      </div>
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

function EditSheet({ habit }: { habit: Habit }) {
  const s = useSteady();
  const [confirm, setConfirm] = useState(false);
  const set = (patch: Partial<Habit>) => s.updateHabitById(habit.id, (h) => ({ ...h, ...patch }));
  const label = { display: "flex", flexDirection: "column", gap: 6 } as const;
  const cap = { font: "700 13px 'Nunito',sans-serif" };
  return (
    <>
      <span className="title sheet-head">Edit habit</span>
      <label style={label}>
        <span className="muted" style={cap}>Name</span>
        <input className="field" value={habit.name} onChange={(e) => set({ name: e.target.value })} style={{ height: 48, padding: "0 14px", borderRadius: 14, font: "600 16px 'Nunito',sans-serif" }} />
      </label>
      <label style={label}>
        <span className="muted" style={cap}>Why it matters to you</span>
        <textarea className="field" value={habit.why} onChange={(e) => set({ why: e.target.value })} rows={3} placeholder="We'll show this on the hard days." style={{ padding: "12px 14px", borderRadius: 14, font: "500 16px/1.4 'Nunito',sans-serif" }} />
      </label>
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
