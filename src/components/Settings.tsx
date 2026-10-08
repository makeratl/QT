import { useState } from "react";
import { habitSummary } from "../lib/calc";
import type { ThemePref } from "../lib/model";
import { useSteady } from "../store";
import { Seg } from "./bits";

export function HabitSub({ id }: { id: string }) {
  const { habits } = useSteady();
  const h = habits.find((x) => x.id === id)!;
  return <span className="row-sub">{habitSummary(h)}</span>;
}

const Section = ({ label, children, style }: { label: string; children: React.ReactNode; style?: React.CSSProperties }) => (
  <section style={{ display: "flex", flexDirection: "column", gap: 8, flex: "none", ...style }}>
    <span className="eyebrow">{label}</span>
    {children}
  </section>
);

export function Settings() {
  const s = useSteady();
  const [confirmReset, setConfirmReset] = useState(false);
  const activeId = s.habit?.id;

  return (
    <>
      <Section label="What you're working on" style={{ marginTop: 6 }}>
        <div className="group">
          {s.habits.map((h) => (
            <div key={h.id} style={{ display: "flex", alignItems: "center", background: "var(--surface)", paddingRight: 10 }}>
              <button onClick={() => s.setActiveId(h.id)} style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 14, padding: "12px 0 12px 16px", textAlign: "left" }}>
                <span className={"radio" + (h.id === activeId ? " on" : "")} />
                <span className="row-text">
                  <span className="row-title">{h.name}</span>
                  <HabitSub id={h.id} />
                </span>
              </button>
              <button className="outline" onClick={() => { s.setEditId(h.id); s.setSheet("edit"); }} style={{ flex: "none", height: 34, padding: "0 14px", borderRadius: 999, font: "700 13px 'Nunito',sans-serif" }}>
                Edit
              </button>
            </div>
          ))}
          <button onClick={s.startOnboarding} style={{ display: "flex", alignItems: "center", gap: 14, height: 52, padding: "0 16px", background: "var(--surface)", color: "var(--teal)", textAlign: "left", font: "800 15px 'Nunito',sans-serif" }}>
            <span style={{ width: 20, height: 20, borderRadius: "50%", background: "var(--teal-tint)", display: "flex", alignItems: "center", justifyContent: "center", font: "800 16px/1 'Nunito',sans-serif" }}>+</span>
            Add something new
          </button>
        </div>
      </Section>

      <Section label="Reminders">
        <div className="group">
          {([["aff", "Daily affirmation", "Every morning at 9:00 am"], ["eve", "Evening check-in", "A gentle nudge at 8:00 pm"]] as const).map(([k, label, sub]) => {
            const on = s.reminders[k];
            return (
              <button key={k} role="switch" aria-checked={on} onClick={() => s.setReminders((r) => ({ ...r, [k]: !r[k] }))} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", background: "var(--surface)", textAlign: "left" }}>
                <span className="row-text">
                  <span className="row-title">{label}</span>
                  <span className="row-sub">{sub}</span>
                </span>
                <span style={{ position: "relative", width: 50, height: 30, borderRadius: 999, background: on ? "var(--teal)" : "var(--line)", transition: "background .2s", flex: "none" }}>
                  <span style={{ position: "absolute", top: 3, left: on ? 23 : 3, width: 24, height: 24, borderRadius: "50%", background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,.2)", transition: "left .2s" }} />
                </span>
              </button>
            );
          })}
        </div>
      </Section>

      <Section label="Appearance">
        <Seg<ThemePref> options={[["system", "Auto"], ["light", "Light"], ["dark", "Dark"]]} value={s.theme} onChange={s.setTheme} height={40} />
      </Section>

      <Section label="Your data">
        <div className="card" style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 10px 12px 16px", borderRadius: 20 }}>
          <span className="muted" style={{ flex: 1, font: "500 13px/1.4 'Nunito',sans-serif", textWrap: "pretty" }}>Stored only on this device. Nothing is sent anywhere.</span>
          <button
            className="outline"
            onClick={() => {
              if (!confirmReset) return setConfirmReset(true);
              setConfirmReset(false);
              s.eraseAll();
            }}
            onBlur={() => setConfirmReset(false)}
            style={{ flex: "none", height: 34, padding: "0 14px", borderRadius: 999, color: "var(--clay)", font: "800 13px 'Nunito',sans-serif" }}
          >
            {confirmReset ? "Tap to confirm" : s.demo ? "Reset sample" : "Erase all"}
          </button>
        </div>
      </Section>
    </>
  );
}
