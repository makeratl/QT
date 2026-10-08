import { useEffect } from "react";
import { calc, calcBuild, calcTrack, dayValue, measureOf, milestoneProgress, patterns, withUnit } from "../lib/calc";
import { BLOCK_PHRASE, MS, MS_LABEL, MS_WEEK_LABEL, TRIG_PHRASE, kindOf, type Habit } from "../lib/model";
import { addDays, plural, sod } from "../lib/util";
import { useSteady, type PTab } from "../store";
import { ChevronLeft, ChevronRight, Seg } from "./bits";

const card = { flex: "none", padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10 } as const;

const TABS: Record<string, [PTab, string][]> = {
  quit: [["calendar", "Calendar"], ["milestones", "Milestones"], ["patterns", "Patterns"]],
  build: [["calendar", "Calendar"], ["milestones", "Milestones"], ["patterns", "Patterns"]],
  track: [["calendar", "Calendar"], ["patterns", "Trends"]],
};

export function Progress({ habit }: { habit: Habit }) {
  const s = useSteady();
  const k = kindOf(habit);
  const tabs = TABS[k];
  const ptab = tabs.some(([t]) => t === s.ptab) ? s.ptab : "calendar";
  useEffect(() => {
    if (ptab !== s.ptab) s.setPtab(ptab);
  }, [ptab, s]);
  return (
    <>
      <Seg<PTab> options={tabs} value={ptab} onChange={s.setPtab} />
      {ptab === "calendar" && (k === "quit" ? <QuitCalendar habit={habit} /> : k === "build" ? <BuildCalendar habit={habit} /> : <TrackCalendar habit={habit} />)}
      {ptab === "milestones" && (k === "build" ? <BuildMilestones habit={habit} /> : <QuitMilestones habit={habit} />)}
      {ptab === "patterns" && (k === "quit" ? <QuitPatterns habit={habit} /> : k === "build" ? <BuildPatterns habit={habit} /> : <TrackTrends habit={habit} />)}
    </>
  );
}

/* ── Shared pieces ─────────────────────────────────────────── */

interface Cell {
  bg: string;
  color: string;
  ring: string;
  dot: boolean;
}

function Stats({ items }: { items: [string | number, string][] }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 8, flex: "none" }}>
      {items.map(([v, label]) => (
        <div key={label} className="card" style={{ padding: "12px 14px", borderRadius: 20, display: "flex", flexDirection: "column", gap: 2 }}>
          <span style={{ font: "300 32px/1 'Nunito',sans-serif", letterSpacing: "-0.03em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{v}</span>
          <span className="muted" style={{ font: "700 12px/1.25 'Nunito',sans-serif" }}>{label}</span>
        </div>
      ))}
    </div>
  );
}

const muted: Cell = { bg: "transparent", color: "var(--muted)", ring: "none", dot: false };
const todayRing = "inset 0 0 0 2px var(--teal)";

function MonthCard({ cell, legend }: { cell: (day: number) => Cell; legend: [number, string, string][] }) {
  const s = useSteady();
  const now = new Date();
  const cm = new Date(now.getFullYear(), now.getMonth() + s.calOffset, 1);
  const daysIn = new Date(cm.getFullYear(), cm.getMonth() + 1, 0).getDate();
  const atCurrent = s.calOffset >= 0;
  const navBtn = { width: 36, height: 36, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" } as const;

  return (
    <div className="card" style={{ flex: "none", padding: "14px 14px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button className="outline" aria-label="Previous month" onClick={() => s.setCalOffset((o) => o - 1)} style={navBtn}>
          <ChevronLeft />
        </button>
        <span style={{ font: "800 16px 'Nunito',sans-serif" }}>{cm.toLocaleDateString([], { month: "long", year: "numeric" })}</span>
        <button className="outline" aria-label="Next month" disabled={atCurrent} onClick={() => s.setCalOffset((o) => Math.min(0, o + 1))} style={{ ...navBtn, opacity: atCurrent ? 0.3 : 1, cursor: atCurrent ? "default" : "pointer" }}>
          <ChevronRight />
        </button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", rowGap: 5, justifyItems: "center" }}>
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <span key={i} className="muted" style={{ font: "700 11px 'Nunito',sans-serif" }}>{d}</span>
        ))}
        {Array.from({ length: cm.getDay() }, (_, i) => <span key={"pad" + i} />)}
        {Array.from({ length: daysIn }, (_, i) => {
          const c = cell(sod(new Date(cm.getFullYear(), cm.getMonth(), i + 1)));
          return (
            <span key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
              <span style={{ width: 36, height: 36, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", font: "700 13px 'Nunito',sans-serif", background: c.bg, color: c.color, boxShadow: c.ring }}>{i + 1}</span>
              <span style={{ width: 4, height: 4, borderRadius: "50%", background: c.dot ? "var(--muted)" : "transparent" }} />
            </span>
          );
        })}
      </div>
      <div className="muted" style={{ display: "flex", gap: 16, justifyContent: "center", font: "600 12px 'Nunito',sans-serif" }}>
        {legend.map(([size, bg, label]) => (
          <span key={label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: size, height: size, borderRadius: "50%", background: bg }} />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

function MilestoneList({ list, label, current, longest }: { list: number[]; label: Record<number, string>; current: number; longest: number }) {
  const { next } = milestoneProgress(current, list);
  return (
    <div className="card" style={{ flex: "none", display: "flex", flexDirection: "column", padding: "4px 16px" }}>
      {list.map((m) => {
        const reached = longest >= m;
        const isNext = m === next;
        return (
          <div key={m} style={{ display: "flex", alignItems: "center", gap: 14, height: 46, opacity: reached || isNext ? 1 : 0.55 }}>
            <span style={{ width: 16, height: 16, borderRadius: "50%", flex: "none", background: reached ? "var(--teal)" : "transparent", boxShadow: reached ? "none" : isNext ? "inset 0 0 0 2px var(--teal)" : "inset 0 0 0 1.5px var(--line)" }} />
            <span style={{ flex: 1, font: "700 15px 'Nunito',sans-serif" }}>{label[m]}</span>
            <span style={{ font: "600 13px 'Nunito',sans-serif", color: isNext ? "var(--teal)" : "var(--muted)" }}>
              {reached ? (current >= m ? "Reached" : "Reached before") : isNext ? `${m - current} to go` : ""}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function Headline({ title, sub }: { title: string; sub: string }) {
  return (
    <div style={{ flex: "none", display: "flex", flexDirection: "column", gap: 2, padding: "4px 4px 0" }}>
      <span style={{ font: "300 28px/1.15 'Nunito',sans-serif", letterSpacing: "-0.02em", textWrap: "balance" }}>{title}</span>
      <span className="muted" style={{ font: "600 14px 'Nunito',sans-serif" }}>{sub}</span>
    </div>
  );
}

function Empty({ children }: { children: string }) {
  return (
    <div className="outline muted" style={{ padding: 20, borderRadius: 22, font: "500 15px/1.45 'Nunito',sans-serif", textAlign: "center", textWrap: "pretty" }}>
      {children}
    </div>
  );
}

const Insight = ({ children }: { children: string }) => (
  <div style={{ flex: "none", padding: "16px 18px", borderRadius: 22, background: "var(--teal-tint)", font: "500 17px/1.4 'Nunito',sans-serif", textWrap: "pretty" }}>{children}</div>
);
const Trend = ({ children }: { children: string }) => (
  <div className="outline muted" style={{ flex: "none", padding: "12px 16px", borderRadius: 20, font: "600 13px/1.45 'Nunito',sans-serif", textWrap: "pretty" }}>{children}</div>
);

function Bars({ title, note, bars }: { title: string; note: string; bars: { label: string; value: number; text: string; peak: boolean }[] }) {
  const max = Math.max(1, ...bars.map((b) => b.value));
  const cols = `repeat(${bars.length},1fr)`;
  const gap = bars.length > 7 ? 4 : 8;
  return (
    <div className="card" style={card}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span style={{ font: "800 14px 'Nunito',sans-serif" }}>{title}</span>
        <span className="muted" style={{ font: "600 12px 'Nunito',sans-serif" }}>{note}</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: cols, gap, alignItems: "end", height: 104 }}>
        {bars.map((b, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", gap: 5, height: "100%" }}>
            <span className="muted" style={{ font: "700 11px 'Nunito',sans-serif" }}>{b.text}</span>
            <span style={{ width: "100%", height: Math.max(6, Math.round((b.value / max) * 78)), borderRadius: bars.length > 7 ? 6 : 9, background: b.peak ? "var(--teal)" : "var(--teal-tint)", transition: "height .4s" }} />
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: cols, gap }}>
        {bars.map((b, i) => (
          <span key={i} className="muted" style={{ font: "700 10px/1.2 'Nunito',sans-serif", textAlign: "center" }}>{b.label}</span>
        ))}
      </div>
    </div>
  );
}

function TimeOfDay({ p }: { p: ReturnType<typeof patterns> }) {
  return <Bars title="Time of day" note="Last 30 days" bars={p.buckets.map((b) => ({ label: b.label, value: b.count, text: String(b.count), peak: b === p.peak }))} />;
}

function Reasons({ title, items, max }: { title: string; items: [string, number][]; max: number }) {
  if (!items.length) return null;
  return (
    <div className="card" style={card}>
      <span style={{ font: "800 14px 'Nunito',sans-serif" }}>{title}</span>
      {items.map(([label, n]) => (
        <div key={label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ width: 92, font: "600 13px 'Nunito',sans-serif", flex: "none" }}>{label}</span>
          <div style={{ flex: 1, height: 8, borderRadius: 8, background: "var(--bg)" }}>
            <div style={{ height: "100%", width: Math.round((n / max) * 100) + "%", borderRadius: 8, background: "var(--clay)" }} />
          </div>
          <span className="muted" style={{ width: 22, textAlign: "right", font: "700 12px 'Nunito',sans-serif" }}>{n}</span>
        </div>
      ))}
    </div>
  );
}

function weekTrend(thisWk: number, lastWk: number, noun: string) {
  if (lastWk === 0) return `${plural(thisWk, noun)} this week.`;
  const ch = Math.round(((thisWk - lastWk) / lastWk) * 100);
  return ch === 0 ? `${plural(thisWk, noun)} this week, same as last.` : `${plural(thisWk, noun)} this week, ${ch < 0 ? "down" : "up"} from ${lastWk} the week before.`;
}

/* ── Quit ──────────────────────────────────────────────────── */

const QUIT_TYPES = ["thought", "trigger", "urge", "resisted", "slip"] as const;

function QuitCalendar({ habit }: { habit: Habit }) {
  const c = calc(habit);
  const moments = new Set(habit.logs.filter((l) => l.type !== "slip").map((l) => sod(l.t)));
  return (
    <>
      <Stats items={[[c.streak, "Current streak"], [c.longest, "Longest streak"], [c.good, "Good days"]]} />
      <MonthCard
        cell={(d) => {
          const dot = moments.has(d) && d <= c.today;
          if (c.slipDays.has(d)) return { bg: "var(--clay)", color: "var(--on-teal)", ring: "none", dot };
          if (d === c.today) return { bg: "transparent", color: "var(--ink)", ring: todayRing, dot };
          if (d >= c.start && d < c.today) return { bg: "var(--teal)", color: "var(--on-teal)", ring: "none", dot };
          return { ...muted, dot };
        }}
        legend={[[10, "var(--teal)", "Good day"], [10, "var(--clay)", "Slip"], [4, "var(--muted)", "Moments logged"]]}
      />
    </>
  );
}

function QuitMilestones({ habit }: { habit: Habit }) {
  const c = calc(habit);
  const { next } = milestoneProgress(c.streak);
  return (
    <>
      <Headline title={next ? `Next up: ${MS_LABEL[next]}. You're ${plural(next - c.streak, "day")} away.` : "Every milestone reached. Remarkable."} sub={`Longest streak: ${plural(c.longest, "day")}`} />
      <MilestoneList list={MS} label={MS_LABEL} current={c.streak} longest={c.longest} />
    </>
  );
}

function QuitPatterns({ habit }: { habit: Habit }) {
  const today = sod(Date.now());
  const p = patterns(habit, today, [...QUIT_TYPES], [...QUIT_TYPES]);
  if (p.count < 5) return <Empty>Patterns show up after a few days of logging. Every tap helps paint the picture.</Empty>;

  const top = p.triggers[0]?.[0];
  const line = `Most of your moments come ${p.peak.phrase}${top ? ", often " + (TRIG_PHRASE[top] || top.toLowerCase()) : ""}. A good time to have a plan.`;
  const moments = ["thought", "trigger", "urge", "resisted"] as const;
  const thisWk = p.countIn([...moments], 7, 0);
  const lastWk = p.countIn([...moments], 14, 7);
  let trend = `${plural(thisWk, "moment")} logged this week.`;
  if (lastWk > 0) {
    const ch = Math.round(((thisWk - lastWk) / lastWk) * 100);
    trend =
      ch < 0 ? `${plural(thisWk, "moment")} this week — ${-ch}% fewer than the week before.`
      : ch > 0 ? `${plural(thisWk, "moment")} this week, up from ${lastWk}. Paying closer attention is a good sign.`
      : `${plural(thisWk, "moment")} this week, same as last.`;
  }
  trend += ` ${plural(habit.logs.filter((l) => l.type === "resisted").length, "urge")} ridden out so far.`;

  return (
    <>
      <Insight>{line}</Insight>
      <TimeOfDay p={p} />
      <Reasons title="Top triggers" items={p.triggers} max={p.maxT} />
      <Trend>{trend}</Trend>
    </>
  );
}

/* ── Build ─────────────────────────────────────────────────── */

function BuildCalendar({ habit }: { habit: Habit }) {
  const b = calcBuild(habit);
  const other = new Set(habit.logs.filter((l) => l.type !== "done").map((l) => sod(l.t)));
  return (
    <>
      <Stats items={[[b.streak, b.per === "day" ? "Current streak" : "Weeks in a row"], [b.longest, b.per === "day" ? "Longest streak" : "Longest (weeks)"], [b.total, "Times done"]]} />
      <MonthCard
        cell={(d) => {
          const n = b.doneByDay.get(d) ?? 0;
          const dot = other.has(d) && d <= b.today;
          const ring = d === b.today ? todayRing : "none";
          if (n >= (b.per === "day" ? b.times : 1)) return { bg: "var(--teal)", color: "var(--on-teal)", ring: d === b.today ? "inset 0 0 0 2px var(--ink)" : "none", dot };
          if (n > 0) return { bg: "var(--teal-tint)", color: "var(--teal)", ring, dot };
          if (d === b.today) return { bg: "transparent", color: "var(--ink)", ring, dot };
          return { ...muted, dot };
        }}
        legend={[[10, "var(--teal)", "Done"], [4, "var(--muted)", "Other moments"]]}
      />
    </>
  );
}

function BuildMilestones({ habit }: { habit: Habit }) {
  const b = calcBuild(habit);
  const { next } = milestoneProgress(b.streak, b.milestones);
  const unit = b.per === "day" ? "day" : "week";
  const labels = b.per === "day" ? MS_LABEL : MS_WEEK_LABEL;
  const title = next ? `Next up: ${labels[next]} in a row. ${plural(next - b.streak, unit)} to go.` : "Every milestone reached. Remarkable.";
  return (
    <>
      <Headline title={title} sub={`Longest streak: ${plural(b.longest, unit)}${b.per === "week" ? ` meeting ${b.times}× a week` : ""}`} />
      <MilestoneList list={b.milestones} label={labels} current={b.streak} longest={b.longest} />
    </>
  );
}

function BuildPatterns({ habit }: { habit: Habit }) {
  const today = sod(Date.now());
  const p = patterns(habit, today, ["done"], ["resist", "skip"]);
  const b = calcBuild(habit);
  if (p.count < 5) return <Empty>Patterns show up after a few sessions. Every one you log helps paint the picture.</Empty>;

  const top = p.triggers[0]?.[0];
  const line = `You usually show up ${p.peak.phrase}.${top ? ` Skips and resistance come mostly ${BLOCK_PHRASE[top] || top.toLowerCase()}.` : " Keep that slot protected."}`;
  let trend = weekTrend(p.countIn(["done"], 7, 0), p.countIn(["done"], 14, 7), "session");
  if (b.minutes > 0) trend += ` ${plural(b.minutes, "minute")} in total so far.`;

  return (
    <>
      <Insight>{line}</Insight>
      <TimeOfDay p={p} />
      <Reasons title="What gets in the way" items={p.triggers} max={p.maxT} />
      <Trend>{trend}</Trend>
    </>
  );
}

/* ── Track ─────────────────────────────────────────────────── */

function TrackCalendar({ habit }: { habit: Habit }) {
  const t = calcTrack(habit);
  const m = measureOf(habit);
  const latest = m.agg === "latest";
  const round = (v: number) => Math.round(v * 10) / 10;
  return (
    <>
      <Stats
        items={[
          [latest ? (t.last ? round(t.last.value ?? 1) : "–") : round(t.todayValue ?? 0), latest ? `Latest (${m.unit})` : `Today (${m.unit})`],
          [t.avg7 !== null ? round(t.avg7) : "–", "7-day average"],
          [t.daysLogged, "Days logged"],
        ]}
      />
      <MonthCard
        cell={(d) => {
          const has = dayValue(habit, d) !== null;
          if (d === t.today) return { bg: has ? "var(--teal-tint)" : "transparent", color: "var(--ink)", ring: todayRing, dot: false };
          if (has) return { bg: "var(--teal-tint)", color: "var(--teal)", ring: "none", dot: false };
          return muted;
        }}
        legend={[[10, "var(--teal-tint)", "Logged"]]}
      />
    </>
  );
}

function TrackTrends({ habit }: { habit: Habit }) {
  const today = sod(Date.now());
  const m = measureOf(habit);
  const t = calcTrack(habit);
  const p = patterns(habit, today, ["entry"], []);
  if (p.count < 5) return <Empty>Trends show up after a few entries. Keep logging and the picture fills in.</Empty>;

  const days = Array.from({ length: 14 }, (_, i) => addDays(today, i - 13));
  const vals = days.map((d) => dayValue(habit, d) ?? 0);
  const peak = Math.max(...vals);
  const round = (v: number) => Math.round(v * 10) / 10;
  let line = `You log most ${p.peak.phrase}.`;
  if (t.avg7 !== null && t.avgPrev7 !== null && t.avgPrev7 > 0) {
    const ch = Math.round(((t.avg7 - t.avgPrev7) / t.avgPrev7) * 100);
    line = `Your 7-day average is ${withUnit(m, round(t.avg7))}${ch === 0 ? ", steady with the week before" : `, ${ch > 0 ? "up" : "down"} ${Math.abs(ch)}% from the week before`}. ${line}`;
  } else if (t.avg7 !== null) line = `Your 7-day average is ${withUnit(m, round(t.avg7))}. ${line}`;

  return (
    <>
      <Insight>{line}</Insight>
      <Bars
        title={m.agg === "latest" ? "Daily value" : "Daily total"}
        note="Last 14 days"
        bars={days.map((d, i) => ({
          label: new Date(d).toLocaleDateString([], { weekday: "narrow" }),
          value: vals[i],
          text: vals[i] && vals.length <= 14 && String(round(vals[i])).length <= 3 ? String(round(vals[i])) : "",
          peak: vals[i] === peak && peak > 0,
        }))}
      />
      <TimeOfDay p={p} />
      <Trend>{`${plural(t.daysLogged, "day")} logged so far.`}</Trend>
    </>
  );
}
