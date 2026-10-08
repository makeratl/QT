import { calc, milestoneProgress } from "../lib/calc";
import { AFF, MS, MS_NAME, TYPES, type Habit, type QuickType } from "../lib/model";
import { DAY, plural, sod } from "../lib/util";
import { useSteady } from "../store";
import { ChevronRight, Glyph } from "./bits";

const C = 596.9; // 2π × 95

export function todayLogs(h: Habit) {
  const today = sod(Date.now());
  return h.logs.filter((l) => sod(l.t) === today).sort((a, b) => b.t - a.t);
}

const TILE_GLYPH: Record<QuickType, React.ReactNode> = {
  thought: <span className="glyph" style={{ width: 24, height: 24, borderRadius: "50%", boxShadow: "inset 0 0 0 2px var(--teal)" }} />,
  trigger: (
    <span className="glyph" style={{ width: 24, height: 24, borderRadius: "50%", boxShadow: "inset 0 0 0 2px var(--clay)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <span style={{ width: 9, height: 9, borderRadius: "50%", background: "var(--clay)" }} />
    </span>
  ),
  urge: <span className="glyph" style={{ width: 24, height: 24, borderRadius: "50%", background: "var(--clay)" }} />,
  resisted: (
    <span className="glyph" style={{ width: 24, height: 24, borderRadius: "50%", boxShadow: "inset 0 0 0 2px var(--on-teal)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <span style={{ width: 10, height: 10, borderRadius: "50%", boxShadow: "inset 0 0 0 2px var(--on-teal)" }} />
    </span>
  ),
};

export function Today({ habit }: { habit: Habit }) {
  const s = useSteady();
  const c = calc(habit);
  const { next, pct } = milestoneProgress(c.streak);

  let sub = next ? `${plural(next - c.streak, "day")} to ${MS_NAME[next]}` : "A full year. Remarkable.";
  if (c.slipToday) sub = `Fresh start tomorrow. ${plural(c.good, "good day")} still count.`;
  else if (c.streak === 0) sub = "Your first day is underway";
  else if (MS.includes(c.streak)) sub = `You reached ${MS_NAME[c.streak]} today`;

  const todays = todayLogs(habit);
  const counts: Record<QuickType, number> = { thought: 0, trigger: 0, urge: 0, resisted: 0 };
  todays.forEach((l) => {
    if (l.type in counts) counts[l.type as QuickType]++;
  });
  const affirmation = s.reminders.aff ? AFF[Math.floor(c.today / DAY) % AFF.length] : AFF[0];

  return (
    <>
      <div className="ring">
        <svg width="210" height="210" viewBox="0 0 210 210" aria-hidden>
          <circle cx="105" cy="105" r="95" fill="none" strokeWidth="12" style={{ stroke: "var(--teal-tint)" }} />
          <circle
            cx="105" cy="105" r="95" fill="none" strokeWidth="12" strokeLinecap="round" strokeDasharray={C}
            strokeDashoffset={(C * (1 - pct)).toFixed(1)}
            style={{ stroke: "var(--teal)", transition: "stroke-dashoffset .8s ease" }}
          />
        </svg>
        <div className="ring-inner">
          <span style={{ font: "300 84px/0.9 'Nunito',sans-serif", letterSpacing: "-0.04em" }}>{c.streak}</span>
          <span style={{ font: "700 15px 'Nunito',sans-serif", marginTop: 6 }}>{(c.streak === 1 ? "day " : "days ") + habit.label}</span>
          <span className="muted" style={{ font: "500 12px/1.3 'Nunito',sans-serif", marginTop: 3, maxWidth: 150, textAlign: "center" }}>{sub}</span>
        </div>
      </div>
      <p style={{ flex: "none", margin: "0 8px", font: "500 16px/1.4 'Nunito',sans-serif", textAlign: "center", textWrap: "balance" }}>{affirmation}</p>
      <div style={{ flex: 1, minHeight: 4 }} />
      <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: "none" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <span style={{ font: "800 17px 'Nunito',sans-serif" }}>Log a moment</span>
          <span className="muted" style={{ font: "600 12px 'Nunito',sans-serif" }}>One tap. Details optional.</span>
        </div>
        <div className="tiles">
          {(["thought", "trigger", "urge", "resisted"] as QuickType[]).map((t) => (
            <button key={t} className={"tile " + t} onClick={() => s.quick(t)}>
              {TILE_GLYPH[t]}
              <span className="tile-text">
                <span className="tile-label">{TYPES[t].label}</span>
                <span className="tile-count">{counts[t]} today</span>
              </span>
            </button>
          ))}
        </div>
        <div className="actions">
          <button className="btn-outline" onClick={() => s.setSheet("slip")}>I slipped</button>
          <button className="btn-outline" onClick={() => s.setSheet("note")}>Note</button>
          <button className="ride" onClick={s.openSurf}>
            Ride it out
            <span className="ride-dot">
              <span style={{ width: 12, height: 12, borderRadius: "50%", boxShadow: "inset 0 0 0 2px var(--on-teal)" }} />
            </span>
          </button>
        </div>
      </div>
      <button className="todaybar" onClick={() => s.setSheet("moments")}>
        <span style={{ display: "flex", flexDirection: "column", flex: "none", width: 76 }}>
          <span style={{ font: "800 14px 'Nunito',sans-serif" }}>Today</span>
          <span className="muted" style={{ font: "600 12px 'Nunito',sans-serif" }}>{plural(todays.length, "moment")}</span>
        </span>
        <span style={{ position: "relative", flex: 1, height: 24 }}>
          <span style={{ position: "absolute", left: 0, right: 0, top: 11, height: 2, borderRadius: 2, background: "var(--line)" }} />
          {todays.map((l) => {
            const d = new Date(l.t);
            const hr = Math.min(24, Math.max(6, d.getHours() + d.getMinutes() / 60));
            return <Glyph key={l.id} type={l.type} style={{ position: "absolute", top: "50%", left: (((hr - 6) / 18) * 100).toFixed(1) + "%", transform: "translate(-50%,-50%)" }} />;
          })}
        </span>
        <ChevronRight style={{ color: "var(--muted)" }} />
      </button>
    </>
  );
}
