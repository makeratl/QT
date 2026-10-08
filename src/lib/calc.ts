import { BUCKETS, MS, MS_WEEKS, type Habit, type Log, type Measure } from "./model";
import { addDays, diffDays, plural, sod } from "./util";

export interface HabitStats {
  today: number;
  start: number;
  slipDays: Set<number>;
  good: number;
  longest: number;
  streak: number;
  slipToday: boolean;
}

/** Quit streak math. A day counts as good if it falls between start and yesterday with no slip. */
export function calc(h: Habit): HabitStats {
  const today = sod(Date.now());
  const start = sod(h.start);
  const slipDays = new Set(h.logs.filter((l) => l.type === "slip").map((l) => sod(l.t)));
  let good = 0;
  let longest = 0;
  let run = 0;
  for (let d = start; d < today; d = addDays(d, 1)) {
    if (slipDays.has(d)) run = 0;
    else {
      good++;
      run++;
      longest = Math.max(longest, run);
    }
  }
  let last: number | null = null;
  slipDays.forEach((d) => {
    if (d >= start && (last === null || d > last)) last = d;
  });
  const base = last !== null ? addDays(last, 1) : start;
  const streak = Math.max(0, diffDays(base, today));
  return { today, start, slipDays, good, longest: Math.max(longest, streak), streak, slipToday: slipDays.has(today) };
}

export function milestoneProgress(streak: number, list = MS) {
  const next = list.find((m) => m > streak) ?? null;
  const prev = [...list].reverse().find((m) => m <= streak) ?? 0;
  const pct = next ? (streak - prev) / (next - prev) : 1;
  return { next, prev, pct };
}

/** Sunday-first, matching the calendar. */
export const weekStart = (t: number) => addDays(sod(t), -new Date(t).getDay());

export interface BuildStats {
  today: number;
  start: number;
  per: "day" | "week";
  times: number;
  doneByDay: Map<number, number>;
  todayCount: number;
  todayMet: boolean;
  weekCount: number;
  weekMet: boolean;
  daysLeftInWeek: number; // including today
  streak: number; // in days or weeks, per goal
  longest: number;
  total: number;
  minutes: number;
  milestones: number[];
}

/**
 * Build streak math. A period (day or week) is met once enough "done" logs land in it.
 * The current period never breaks the streak; it only adds to it once met.
 */
export function calcBuild(h: Habit): BuildStats {
  const today = sod(Date.now());
  const start = sod(h.start);
  const per = h.goal?.per ?? "day";
  const times = Math.max(1, h.goal?.times ?? 1);
  const done = h.logs.filter((l) => l.type === "done");
  const doneByDay = new Map<number, number>();
  done.forEach((l) => doneByDay.set(sod(l.t), (doneByDay.get(sod(l.t)) ?? 0) + 1));
  const todayCount = doneByDay.get(today) ?? 0;
  const thisWeek = weekStart(today);
  let weekCount = 0;
  for (let d = thisWeek; d <= today; d = addDays(d, 1)) weekCount += doneByDay.get(d) ?? 0;

  let run = 0;
  let longest = 0;
  if (per === "day") {
    for (let d = start; d < today; d = addDays(d, 1)) {
      if ((doneByDay.get(d) ?? 0) >= times) longest = Math.max(longest, ++run);
      else run = 0;
    }
  } else {
    for (let w = weekStart(start); w < thisWeek; w = addDays(w, 7)) {
      let n = 0;
      for (let i = 0; i < 7; i++) n += doneByDay.get(addDays(w, i)) ?? 0;
      if (n >= times) longest = Math.max(longest, ++run);
      else run = 0;
    }
  }
  const todayMet = todayCount >= times;
  const weekMet = weekCount >= times;
  const streak = run + ((per === "day" ? todayMet : weekMet) ? 1 : 0);
  return {
    today, start, per, times, doneByDay, todayCount, todayMet, weekCount, weekMet,
    daysLeftInWeek: 7 - diffDays(thisWeek, today),
    streak,
    longest: Math.max(longest, streak),
    total: done.length,
    minutes: done.reduce((a, l) => a + (l.value ?? 0), 0),
    milestones: per === "day" ? MS : MS_WEEKS,
  };
}

export const measureOf = (h: Habit): Measure => h.measure ?? { mode: "count", unit: "times", unitOne: "time", agg: "sum" };

export const fmtNum = (v: number) => v.toLocaleString([], { maximumFractionDigits: 1 });
export const unitFor = (m: Measure, v: number) => (v === 1 ? (m.unitOne ?? m.unit) : m.unit);
export const withUnit = (m: Measure, v: number) => `${fmtNum(v)} ${unitFor(m, v)}`;

/** One day's total for a tracker, or null when nothing was logged. */
export function dayValue(h: Habit, day: number): number | null {
  const m = measureOf(h);
  const es = h.logs.filter((l) => l.type === "entry" && sod(l.t) === day).sort((a, b) => a.t - b.t);
  if (!es.length) return null;
  if (m.agg === "latest") return es[es.length - 1].value ?? 1;
  return es.reduce((a, l) => a + (l.value ?? 1), 0);
}

export function calcTrack(h: Habit) {
  const today = sod(Date.now());
  const avg = (from: number, to: number) => {
    const vals: number[] = [];
    for (let d = from; d < to; d = addDays(d, 1)) {
      const v = dayValue(h, d);
      if (v !== null) vals.push(v);
    }
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
  };
  const entries = h.logs.filter((l) => l.type === "entry");
  const last = entries.reduce<Log | null>((a, l) => (!a || l.t > a.t ? l : a), null);
  return {
    today,
    todayValue: dayValue(h, today),
    avg7: avg(addDays(today, -7), today),
    avgPrev7: avg(addDays(today, -14), addDays(today, -7)),
    daysLogged: new Set(entries.map((l) => sod(l.t))).size,
    last,
  };
}

/** One-line status for habit lists (switcher, settings). */
export function habitSummary(h: Habit): string {
  if (h.kind === "build") {
    const b = calcBuild(h);
    return b.per === "day" ? `${plural(b.streak, "day")} in a row` : `${b.weekCount} of ${b.times} this week`;
  }
  if (h.kind === "track") {
    const m = measureOf(h);
    const t = calcTrack(h);
    if (m.agg === "latest") return t.last ? `Latest: ${withUnit(m, t.last.value ?? 1)}` : "Nothing logged yet";
    return `${withUnit(m, t.todayValue ?? 0)} today`;
  }
  return `${plural(calc(h).streak, "day")} ${h.label}`;
}

export function patterns(h: Habit, today: number, timeTypes: Log["type"][], reasonTypes: Log["type"][]) {
  const cutoff = addDays(today, -30);
  const recent = h.logs.filter((l) => l.t >= cutoff && timeTypes.includes(l.type));
  const buckets = BUCKETS.map(([label, a, b, phrase]) => ({
    label,
    phrase,
    count: recent.filter((l) => {
      const hr = new Date(l.t).getHours();
      const x = hr < 5 ? hr + 24 : hr;
      return x >= a && x < b;
    }).length,
  }));
  const maxB = Math.max(1, ...buckets.map((b) => b.count));
  const peak = buckets.reduce((a, b) => (b.count > a.count ? b : a), buckets[0]);
  const tc: Record<string, number> = {};
  h.logs.forEach((l) => {
    if (l.t >= cutoff && reasonTypes.includes(l.type) && l.trigger) tc[l.trigger] = (tc[l.trigger] || 0) + 1;
  });
  const triggers = Object.entries(tc)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);
  const maxT = Math.max(1, ...triggers.map((t) => t[1]));
  const countIn = (types: Log["type"][], a: number, b: number) =>
    h.logs.filter((l) => types.includes(l.type) && l.t >= addDays(today, -a) && l.t < addDays(today, -b)).length;
  return { count: recent.length, buckets, maxB, peak, triggers, maxT, countIn };
}
