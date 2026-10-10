import type { ReactNode } from "react";
import { calc, calcBuild, calcTrack, compareToday, fmtNum, measureOf, milestoneProgress, unitFor, withUnit } from "../lib/calc";
import { AFF, AFF_BUILD, MS_NAME, TYPES, kindOf, type BuildQuick, type Habit, type QuickType } from "../lib/model";
import { DAY, addDays, fmtTime, plural, sod } from "../lib/util";
import { useSteady } from "../store";
import { ChevronRight, Glyph } from "./bits";

const C = 596.9; // 2π × 95

export function todayLogs(h: Habit) {
  const today = sod(Date.now());
  return h.logs.filter((l) => sod(l.t) === today).sort((a, b) => b.t - a.t);
}

const ringGlyph = (color: string, inner?: ReactNode) => (
  <span className="glyph" style={{ width: 24, height: 24, borderRadius: "50%", boxShadow: `inset 0 0 0 2px ${color}`, display: "flex", alignItems: "center", justifyContent: "center" }}>{inner}</span>
);
const dot = (size: number, style: React.CSSProperties) => <span style={{ width: size, height: size, borderRadius: "50%", ...style }} />;

const TILE_GLYPH = {
  thought: ringGlyph("var(--teal)"),
  trigger: ringGlyph("var(--clay)", dot(9, { background: "var(--clay)" })),
  urge: <span className="glyph" style={{ width: 24, height: 24, borderRadius: "50%", background: "var(--clay)" }} />,
  resisted: ringGlyph("var(--on-teal)", dot(10, { boxShadow: "inset 0 0 0 2px var(--on-teal)" })),
  done: ringGlyph("var(--on-teal)", dot(10, { background: "var(--on-teal)" })),
  resist: ringGlyph("var(--clay)", dot(9, { background: "var(--clay)" })),
  plus: ringGlyph("var(--on-teal)", <span style={{ font: "800 16px/1 'Nunito',sans-serif", marginTop: -1 }}>+</span>),
  edit: ringGlyph("var(--teal)", <span style={{ font: "800 13px/1 'Nunito',sans-serif", color: "var(--teal)" }}>#</span>),
};

function Ring({ num, label, sub, pct }: { num: string | number; label: string; sub: string; pct: number }) {
  const len = String(num).length;
  const size = len <= 3 ? 84 : len === 4 ? 66 : 52;
  return (
    <div className="ring">
      <svg width="210" height="210" viewBox="0 0 210 210" aria-hidden>
        <circle cx="105" cy="105" r="95" fill="none" strokeWidth="12" style={{ stroke: "var(--teal-tint)" }} />
        <circle
          cx="105" cy="105" r="95" fill="none" strokeWidth="12" strokeLinecap="round" strokeDasharray={C}
          strokeDashoffset={(C * (1 - Math.max(0, Math.min(1, pct)))).toFixed(1)}
          style={{ stroke: "var(--teal)", transition: "stroke-dashoffset .8s ease", opacity: pct > 0 ? 1 : 0 }}
        />
      </svg>
      <div className="ring-inner">
        <span style={{ font: `300 ${size}px/0.9 'Nunito',sans-serif`, letterSpacing: "-0.04em" }}>{num}</span>
        <span style={{ font: "700 15px 'Nunito',sans-serif", marginTop: 6, maxWidth: 160, textAlign: "center" }}>{label}</span>
        <span className="muted" style={{ font: "500 12px/1.3 'Nunito',sans-serif", marginTop: 3, maxWidth: 150, textAlign: "center" }}>{sub}</span>
      </div>
    </div>
  );
}

const Line = ({ children }: { children: ReactNode }) => (
  <p style={{ flex: "none", margin: "0 8px", font: "500 16px/1.4 'Nunito',sans-serif", textAlign: "center", textWrap: "balance" }}>{children}</p>
);

function Tile({ glyph, label, count, primary, onClick, className = "" }: { glyph: ReactNode; label: string; count: string; primary?: boolean; onClick: () => void; className?: string }) {
  return (
    <button className={"tile " + (primary ? "resisted " : "") + className} onClick={onClick}>
      {glyph}
      <span className="tile-text">
        <span className="tile-label">{label}</span>
        <span className="tile-count">{count}</span>
      </span>
    </button>
  );
}

function LogSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <>
      <div style={{ flex: 1, minHeight: 4 }} />
      <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: "none" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <span style={{ font: "800 17px 'Nunito',sans-serif" }}>{title}</span>
          <span className="muted" style={{ font: "600 12px 'Nunito',sans-serif" }}>One tap. Details optional.</span>
        </div>
        {children}
      </div>
    </>
  );
}

function SessionButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button className="ride" onClick={onClick}>
      {label}
      <span className="ride-dot">
        <span style={{ width: 12, height: 12, borderRadius: "50%", boxShadow: "inset 0 0 0 2px var(--on-teal)" }} />
      </span>
    </button>
  );
}

/** Position on the 6am–midnight timeline, as a CSS percentage. */
const timelineLeft = (t: number) => {
  const d = new Date(t);
  const hr = Math.min(24, Math.max(6, d.getHours() + d.getMinutes() / 60));
  return (((hr - 6) / 18) * 100).toFixed(1) + "%";
};

const TONE_COLOR = { good: "var(--teal)", harder: "var(--muted)", neutral: "var(--muted)" };

function TodayBar({ habit }: { habit: Habit }) {
  const s = useSteady();
  const now = Date.now();
  const todays = todayLogs(habit);
  const cmp = compareToday(habit, now);
  const today = sod(now);
  const yesterday = cmp ? habit.logs.filter((l) => cmp.ghostTypes.includes(l.type) && sod(l.t) === addDays(today, -1)) : [];
  const nowHr = new Date(now).getHours();
  const glyphAt = (t: number) => ({ position: "absolute", top: "50%", left: timelineLeft(t), transform: "translate(-50%,-50%)" }) as const;

  return (
    <button className="todaybar" onClick={() => s.setSheet("moments")} style={cmp ? { height: "auto", minHeight: 58, padding: "10px 16px" } : undefined}>
      <span style={{ display: "flex", flexDirection: "column", flex: "none", width: 76 }}>
        <span style={{ font: "800 14px 'Nunito',sans-serif" }}>Today</span>
        <span className="muted" style={{ font: "600 12px 'Nunito',sans-serif" }}>{kindOf(habit) === "track" ? plural(todays.length, "entry", "entries") : plural(todays.length, "moment")}</span>
      </span>
      <span style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 3 }}>
        <span style={{ position: "relative", height: 24 }}>
          <span style={{ position: "absolute", left: 0, right: 0, top: 11, height: 2, borderRadius: 2, background: "var(--line)" }} />
          {yesterday.map((l) => (
            <Glyph key={l.id} type={l.type} style={{ ...glyphAt(l.t), opacity: 0.28 }} />
          ))}
          {cmp && nowHr >= 6 && <span aria-hidden style={{ position: "absolute", top: 4, height: 16, width: 1.5, borderRadius: 1, left: timelineLeft(now), background: "var(--muted)", opacity: 0.6 }} />}
          {todays.map((l) => (
            <Glyph key={l.id} type={l.type} style={glyphAt(l.t)} />
          ))}
        </span>
        {cmp && <span style={{ font: "600 12px/1.25 'Nunito',sans-serif", color: TONE_COLOR[cmp.tone] }}>{cmp.line}</span>}
      </span>
      <ChevronRight style={{ color: "var(--muted)" }} />
    </button>
  );
}

export function Today({ habit }: { habit: Habit }) {
  const k = kindOf(habit);
  return (
    <>
      {k === "quit" && <TodayQuit habit={habit} />}
      {k === "build" && <TodayBuild habit={habit} />}
      {k === "track" && <TodayTrack habit={habit} />}
      <TodayBar habit={habit} />
    </>
  );
}

function TodayQuit({ habit }: { habit: Habit }) {
  const s = useSteady();
  const c = calc(habit);
  const { next, pct } = milestoneProgress(c.streak);

  let sub = next ? `${plural(next - c.streak, "day")} to ${MS_NAME[next]}` : "A full year. Remarkable.";
  if (c.slipToday) sub = `Fresh start tomorrow. ${plural(c.good, "good day")} still count.`;
  else if (c.streak === 0) sub = "Your first day is underway";
  else if (MS_NAME[c.streak]) sub = `You reached ${MS_NAME[c.streak]} today`;

  const counts: Record<QuickType, number> = { thought: 0, trigger: 0, urge: 0, resisted: 0 };
  todayLogs(habit).forEach((l) => {
    if (l.type in counts) counts[l.type as QuickType]++;
  });

  return (
    <>
      <Ring num={c.streak} label={(c.streak === 1 ? "day " : "days ") + habit.label} sub={sub} pct={pct} />
      <Line>{s.reminders.aff ? AFF[Math.floor(c.today / DAY) % AFF.length] : AFF[0]}</Line>
      <LogSection title="Log a moment">
        <div className="tiles">
          {(["thought", "trigger", "urge", "resisted"] as QuickType[]).map((t) => (
            <Tile key={t} className={t} primary={t === "resisted"} glyph={TILE_GLYPH[t]} label={TYPES[t].label} count={`${counts[t]} today`} onClick={() => s.quick(t)} />
          ))}
        </div>
        <div className="actions">
          <button className="btn-outline" onClick={() => s.setSheet("slip")}>I slipped</button>
          <button className="btn-outline" onClick={() => s.setSheet("note")}>Note</button>
          <SessionButton label="Ride it out" onClick={s.openSurf} />
        </div>
      </LogSection>
    </>
  );
}

function TodayBuild({ habit }: { habit: Habit }) {
  const s = useSteady();
  const b = calcBuild(habit);
  const counts: Record<BuildQuick, number> = { done: 0, resist: 0, skip: 0 };
  todayLogs(habit).forEach((l) => {
    if (l.type in counts) counts[l.type as BuildQuick]++;
  });

  let ring: { num: number; label: string; sub: string; pct: number };
  if (b.per === "day") {
    const { pct } = milestoneProgress(b.streak, b.milestones);
    const sub = b.todayMet
      ? MS_NAME[b.streak] && b.streak > 1 ? `You reached ${MS_NAME[b.streak]} today` : "Done for today. Nice work."
      : b.streak > 0 ? `Do it today to make it ${b.streak + 1}` : b.longest > 0 ? "Do it today to start a new run" : "Today's a good day to start";
    ring = { num: b.streak, label: (b.streak === 1 ? "day" : "days") + " in a row", sub, pct };
  } else {
    const left = b.times - b.weekCount;
    const sub = b.weekMet
      ? b.streak > 1 ? `${plural(b.streak, "week")} in a row` : "This week's goal is met."
      : `${left} more to go · ${plural(b.daysLeftInWeek, "day")} left`;
    ring = { num: b.weekCount, label: `of ${b.times} this week`, sub, pct: b.weekCount / b.times };
  }

  return (
    <>
      <Ring {...ring} />
      <Line>{s.reminders.aff ? AFF_BUILD[Math.floor(b.today / DAY) % AFF_BUILD.length] : AFF_BUILD[0]}</Line>
      <LogSection title="Log it">
        <div className="tiles">
          <Tile primary glyph={TILE_GLYPH.done} label="Did it" count={b.per === "day" ? `${counts.done} today` : `${b.weekCount} this week`} onClick={() => s.quick("done")} />
          <Tile className="urge" glyph={TILE_GLYPH.resist} label="Felt resistance" count={`${counts.resist} today`} onClick={() => s.quick("resist")} />
        </div>
        <div className="actions" style={{ gridTemplateColumns: "1fr 1fr 2fr" }}>
          <button className="btn-outline" onClick={() => s.quick("skip")}>Skipped</button>
          <button className="btn-outline" onClick={() => s.setSheet("note")}>Note</button>
          <SessionButton label="Start session" onClick={s.openSurf} />
        </div>
      </LogSection>
    </>
  );
}

function TodayTrack({ habit }: { habit: Habit }) {
  const s = useSteady();
  const m = measureOf(habit);
  const t = calcTrack(habit);
  const latest = m.agg === "latest";
  const todayEntries = todayLogs(habit).filter((l) => l.type === "entry");
  const v = t.todayValue;

  const num = v === null ? (latest && t.last ? fmtNum(t.last.value ?? 1) : "0") : fmtNum(v);
  const label = latest ? (v === null && t.last ? `${m.unit} · last logged` : m.unit) : `${unitFor(m, v ?? 0)} today`;
  const sub = t.avg7 !== null ? `7-day avg: ${withUnit(m, Math.round(t.avg7 * 10) / 10)}` : "A few days of entries will show your average";
  const pct = latest ? (v !== null ? 1 : 0) : t.avg7 ? (v ?? 0) / t.avg7 : v ? 1 : 0;

  const lastVal = t.last?.value ?? null;
  const quickOne = () => (m.mode === "count" ? s.addEntry(1) : lastVal !== null ? s.addEntry(lastVal) : s.setSheet("entry"));
  const quickLabel = m.mode === "count" ? `Add 1 ${unitFor(m, 1)}` : lastVal !== null ? `Log ${withUnit(m, lastVal)}` : `Log ${m.unit}`;

  return (
    <>
      <Ring num={num} label={label} sub={sub} pct={pct} />
      <Line>{t.last && sod(t.last.t) === t.today ? `Last logged at ${fmtTime(t.last.t)}.` : "Nothing logged yet today."}</Line>
      <LogSection title="Log an entry">
        <div className="tiles">
          <Tile primary glyph={TILE_GLYPH.plus} label={quickLabel} count={plural(todayEntries.length, "entry", "entries") + " today"} onClick={quickOne} />
          <Tile glyph={TILE_GLYPH.edit} label={m.mode === "count" ? "Add several" : "Enter amount"} count="Type a number" onClick={() => s.setSheet("entry")} />
        </div>
        <div className="actions" style={{ gridTemplateColumns: "1fr 1fr" }}>
          <button className="btn-outline" disabled={!todayEntries.length} onClick={s.undoLast} style={{ opacity: todayEntries.length ? 1 : 0.4 }}>Undo last</button>
          <button className="btn-outline" onClick={() => s.setSheet("note")}>Note</button>
        </div>
      </LogSection>
    </>
  );
}
