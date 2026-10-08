import { calc, milestoneProgress, patterns } from "../lib/calc";
import { MS, MS_LABEL, TRIG_PHRASE, type Habit } from "../lib/model";
import { plural, sod } from "../lib/util";
import { useSteady, type PTab } from "../store";
import { ChevronLeft, ChevronRight, Seg } from "./bits";

const card = { flex: "none", padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10 } as const;

export function Progress({ habit }: { habit: Habit }) {
  const s = useSteady();
  return (
    <>
      <Seg<PTab> options={[["calendar", "Calendar"], ["milestones", "Milestones"], ["patterns", "Patterns"]]} value={s.ptab} onChange={s.setPtab} />
      {s.ptab === "calendar" && <Calendar habit={habit} />}
      {s.ptab === "milestones" && <Milestones habit={habit} />}
      {s.ptab === "patterns" && <Patterns habit={habit} />}
    </>
  );
}

function Calendar({ habit }: { habit: Habit }) {
  const s = useSteady();
  const c = calc(habit);
  const now = new Date();
  const cm = new Date(now.getFullYear(), now.getMonth() + s.calOffset, 1);
  const daysIn = new Date(cm.getFullYear(), cm.getMonth() + 1, 0).getDate();
  const moments: Record<number, number> = {};
  habit.logs.forEach((l) => {
    if (l.type !== "slip") {
      const d = sod(l.t);
      moments[d] = (moments[d] || 0) + 1;
    }
  });
  const stats = [
    [c.streak, "Current streak"],
    [c.longest, "Longest streak"],
    [c.good, "Good days"],
  ] as const;
  const atCurrent = s.calOffset >= 0;

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 8, flex: "none" }}>
        {stats.map(([v, label]) => (
          <div key={label} className="card" style={{ padding: "12px 14px", borderRadius: 20, display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={{ font: "300 32px/1 'Nunito',sans-serif", letterSpacing: "-0.03em" }}>{v}</span>
            <span className="muted" style={{ font: "700 12px/1.25 'Nunito',sans-serif" }}>{label}</span>
          </div>
        ))}
      </div>
      <div className="card" style={{ flex: "none", padding: "14px 14px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button className="outline" aria-label="Previous month" onClick={() => s.setCalOffset((o) => o - 1)} style={{ width: 36, height: 36, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ChevronLeft />
          </button>
          <span style={{ font: "800 16px 'Nunito',sans-serif" }}>{cm.toLocaleDateString([], { month: "long", year: "numeric" })}</span>
          <button className="outline" aria-label="Next month" disabled={atCurrent} onClick={() => s.setCalOffset((o) => Math.min(0, o + 1))} style={{ width: 36, height: 36, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", opacity: atCurrent ? 0.3 : 1, cursor: atCurrent ? "default" : "pointer" }}>
            <ChevronRight />
          </button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", rowGap: 5, justifyItems: "center" }}>
          {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
            <span key={i} className="muted" style={{ font: "700 11px 'Nunito',sans-serif" }}>{d}</span>
          ))}
          {Array.from({ length: cm.getDay() }, (_, i) => <span key={"pad" + i} />)}
          {Array.from({ length: daysIn }, (_, i) => {
            const d = sod(new Date(cm.getFullYear(), cm.getMonth(), i + 1));
            let bg = "transparent", color = "var(--muted)", ring = "none";
            if (c.slipDays.has(d)) { bg = "var(--clay)"; color = "var(--on-teal)"; }
            else if (d === c.today) { color = "var(--ink)"; ring = "inset 0 0 0 2px var(--teal)"; }
            else if (d >= c.start && d < c.today) { bg = "var(--teal)"; color = "var(--on-teal)"; }
            return (
              <span key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                <span style={{ width: 36, height: 36, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", font: "700 13px 'Nunito',sans-serif", background: bg, color, boxShadow: ring }}>{i + 1}</span>
                <span style={{ width: 4, height: 4, borderRadius: "50%", background: moments[d] && d <= c.today ? "var(--muted)" : "transparent" }} />
              </span>
            );
          })}
        </div>
        <div className="muted" style={{ display: "flex", gap: 16, justifyContent: "center", font: "600 12px 'Nunito',sans-serif" }}>
          <Legend size={10} bg="var(--teal)">Good day</Legend>
          <Legend size={10} bg="var(--clay)">Slip</Legend>
          <Legend size={4} bg="var(--muted)">Moments logged</Legend>
        </div>
      </div>
    </>
  );
}

const Legend = ({ size, bg, children }: { size: number; bg: string; children: string }) => (
  <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
    <span style={{ width: size, height: size, borderRadius: "50%", background: bg }} />
    {children}
  </span>
);

function Milestones({ habit }: { habit: Habit }) {
  const c = calc(habit);
  const { next } = milestoneProgress(c.streak);
  return (
    <>
      <div style={{ flex: "none", display: "flex", flexDirection: "column", gap: 2, padding: "4px 4px 0" }}>
        <span style={{ font: "300 28px/1.15 'Nunito',sans-serif", letterSpacing: "-0.02em", textWrap: "balance" }}>
          {next ? `Next up: ${MS_LABEL[next]}. You're ${plural(next - c.streak, "day")} away.` : "Every milestone reached. Remarkable."}
        </span>
        <span className="muted" style={{ font: "600 14px 'Nunito',sans-serif" }}>Longest streak: {plural(c.longest, "day")}</span>
      </div>
      <div className="card" style={{ flex: "none", display: "flex", flexDirection: "column", padding: "4px 16px" }}>
        {MS.map((m) => {
          const reached = c.longest >= m;
          const isNext = m === next;
          return (
            <div key={m} style={{ display: "flex", alignItems: "center", gap: 14, height: 46, opacity: reached || isNext ? 1 : 0.55 }}>
              <span style={{ width: 16, height: 16, borderRadius: "50%", flex: "none", background: reached ? "var(--teal)" : "transparent", boxShadow: reached ? "none" : isNext ? "inset 0 0 0 2px var(--teal)" : "inset 0 0 0 1.5px var(--line)" }} />
              <span style={{ flex: 1, font: "700 15px 'Nunito',sans-serif" }}>{MS_LABEL[m]}</span>
              <span style={{ font: "600 13px 'Nunito',sans-serif", color: isNext ? "var(--teal)" : "var(--muted)" }}>
                {reached ? (c.streak >= m ? "Reached" : "Reached before") : isNext ? `${plural(m - c.streak, "day")} to go` : ""}
              </span>
            </div>
          );
        })}
      </div>
    </>
  );
}

function Patterns({ habit }: { habit: Habit }) {
  const p = patterns(habit, sod(Date.now()));
  if (p.count < 5)
    return (
      <div className="outline muted" style={{ padding: 20, borderRadius: 22, font: "500 15px/1.45 'Nunito',sans-serif", textAlign: "center", textWrap: "pretty" }}>
        Patterns show up after a few days of logging. Every tap helps paint the picture.
      </div>
    );

  const top = p.triggers[0]?.[0];
  const line = `Most of your moments come ${p.peak.phrase}${top ? ", often " + (TRIG_PHRASE[top] || top.toLowerCase()) : ""}. A good time to have a plan.`;
  let trend = `${plural(p.thisWk, "moment")} logged this week.`;
  if (p.lastWk > 0) {
    const ch = Math.round(((p.thisWk - p.lastWk) / p.lastWk) * 100);
    trend =
      ch < 0 ? `${plural(p.thisWk, "moment")} this week — ${-ch}% fewer than the week before.`
      : ch > 0 ? `${plural(p.thisWk, "moment")} this week, up from ${p.lastWk}. Paying closer attention is a good sign.`
      : `${plural(p.thisWk, "moment")} this week, same as last.`;
  }
  trend += ` ${plural(p.resistedAll, "urge")} ridden out so far.`;

  return (
    <>
      <div style={{ flex: "none", padding: "16px 18px", borderRadius: 22, background: "var(--teal-tint)", font: "500 17px/1.4 'Nunito',sans-serif", textWrap: "pretty" }}>{line}</div>
      <div className="card" style={card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <span style={{ font: "800 14px 'Nunito',sans-serif" }}>Time of day</span>
          <span className="muted" style={{ font: "600 12px 'Nunito',sans-serif" }}>Last 30 days</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 8, alignItems: "end", height: 104 }}>
          {p.buckets.map((b) => (
            <div key={b.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", gap: 5, height: "100%" }}>
              <span className="muted" style={{ font: "700 11px 'Nunito',sans-serif" }}>{b.count}</span>
              <span style={{ width: "100%", height: Math.max(6, Math.round((b.count / p.maxB) * 78)), borderRadius: 9, background: b === p.peak ? "var(--teal)" : "var(--teal-tint)", transition: "height .4s" }} />
            </div>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 8 }}>
          {p.buckets.map((b) => (
            <span key={b.label} className="muted" style={{ font: "700 10px/1.2 'Nunito',sans-serif", textAlign: "center" }}>{b.label}</span>
          ))}
        </div>
      </div>
      <div className="card" style={card}>
        <span style={{ font: "800 14px 'Nunito',sans-serif" }}>Top triggers</span>
        {p.triggers.map(([label, n]) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ width: 92, font: "600 13px 'Nunito',sans-serif", flex: "none" }}>{label}</span>
            <div style={{ flex: 1, height: 8, borderRadius: 8, background: "var(--bg)" }}>
              <div style={{ height: "100%", width: Math.round((n / p.maxT) * 100) + "%", borderRadius: 8, background: "var(--clay)" }} />
            </div>
            <span className="muted" style={{ width: 22, textAlign: "right", font: "700 12px 'Nunito',sans-serif" }}>{n}</span>
          </div>
        ))}
      </div>
      <div className="outline muted" style={{ flex: "none", padding: "12px 16px", borderRadius: 20, font: "600 13px/1.45 'Nunito',sans-serif", textWrap: "pretty" }}>{trend}</div>
    </>
  );
}
