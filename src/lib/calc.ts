import { BUCKETS, MS, MS_WEEKS, type Habit, type Log, type Measure } from "./model";
import { DAY, addDays, diffDays, plural, sod } from "./util";

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

/* ── Today vs. yesterday ───────────────────────────────────── */

export type Tone = "good" | "harder" | "neutral";
export interface Compare {
  line: string;
  tone: Tone;
  /** Log types to ghost from yesterday on the timeline. */
  ghostTypes: Log["type"][];
}

const CRAVINGS: Log["type"][] = ["thought", "trigger", "urge"];

/**
 * Compares today so far with yesterday up to the same clock time, so a
 * morning check isn't measured against a full day. Returns null when
 * there's no yesterday to compare with.
 */
export function compareToday(h: Habit, now = Date.now()): Compare | null {
  const today = sod(now);
  const yStart = addDays(today, -1);
  if (sod(h.start) > yStart) return null;
  const sameTimeYesterday = yStart + (now - today);
  const inRange = (types: Log["type"][], from: number, to: number) => h.logs.filter((l) => types.includes(l.type) && l.t >= from && l.t <= to);
  const kind = h.kind ?? "quit";

  if (kind === "quit") {
    const a = inRange(CRAVINGS, today, now).length;
    const b = inRange(CRAVINGS, yStart, sameTimeYesterday).length;
    const d = a - b;
    const ghostTypes: Log["type"][] = ["thought", "trigger", "urge", "resisted", "slip"];
    if (d < 0) return { line: `${plural(-d, "craving")} fewer than yesterday by now`, tone: "good", ghostTypes };
    if (d > 0) return { line: `A harder day so far: ${d} more than yesterday`, tone: "harder", ghostTypes };
    return { line: a === 0 ? "Quiet so far, like yesterday" : "Same as yesterday by now", tone: "neutral", ghostTypes };
  }

  if (kind === "build") {
    const ghostTypes: Log["type"][] = ["done", "resist", "skip"];
    if (h.goal?.per === "week") {
      const ws = weekStart(today);
      if (sod(h.start) >= ws) return null;
      const a = inRange(["done"], ws, now).length;
      const b = inRange(["done"], addDays(ws, -7), now - 7 * DAY).length;
      const d = a - b;
      const lead = `${a} so far this week`;
      if (d > 0) return { line: `${lead}, ${d} ahead of last week`, tone: "good", ghostTypes };
      if (d < 0) return { line: `${lead}, ${-d} behind last week`, tone: "neutral", ghostTypes };
      return { line: `${lead}, same as last week by now`, tone: "neutral", ghostTypes };
    }
    const todayDone = inRange(["done"], today, now);
    const yDone = inRange(["done"], yStart, sameTimeYesterday);
    const mins = (ls: Log[]) => ls.reduce((s, l) => s + (l.value ?? 0), 0);
    const ma = mins(todayDone);
    const mb = mins(yDone);
    if (ma > 0 || mb > 0) {
      const d = ma - mb;
      if (d > 0) return { line: `${d} min more than yesterday by now`, tone: "good", ghostTypes };
      if (d < 0) return { line: `${-d} min less than yesterday by now`, tone: "neutral", ghostTypes };
      return { line: "Same time in as yesterday", tone: "good", ghostTypes };
    }
    if (todayDone.length && yDone.length) return { line: "Done today and yesterday", tone: "good", ghostTypes };
    if (todayDone.length) return { line: "Done, ahead of yesterday by now", tone: "good", ghostTypes };
    if (yDone.length) return { line: "You'd done it by now yesterday", tone: "neutral", ghostTypes };
    return { line: "Not yet, same as yesterday by now", tone: "neutral", ghostTypes };
  }

  // track
  const m = measureOf(h);
  const ghostTypes: Log["type"][] = ["entry"];
  const round = (v: number) => Math.round(v * 10) / 10;
  const toneFor = (d: number): Tone => (m.better === "more" && d > 0) || (m.better === "less" && d < 0) ? "good" : "neutral";
  if (m.agg === "latest") {
    const a = dayValue(h, today);
    const b = dayValue(h, yStart);
    if (b === null) return null;
    if (a === null) return { line: `Yesterday: ${withUnit(m, round(b))}`, tone: "neutral", ghostTypes };
    const d = round(a - b);
    if (d === 0) return { line: "Same as yesterday", tone: "neutral", ghostTypes };
    return { line: `${withUnit(m, Math.abs(d))} ${d > 0 ? "up" : "down"} from yesterday`, tone: toneFor(d), ghostTypes };
  }
  const sum = (ls: Log[]) => ls.reduce((s, l) => s + (l.value ?? 1), 0);
  const a = sum(inRange(["entry"], today, now));
  const b = sum(inRange(["entry"], yStart, sameTimeYesterday));
  const d = round(a - b);
  if (d === 0) return { line: a === 0 ? "Nothing yet, same as yesterday by now" : "Same as yesterday by now", tone: "neutral", ghostTypes };
  return { line: `${withUnit(m, Math.abs(d))} ${d > 0 ? "more" : m.mode === "count" ? "fewer" : "less"} than yesterday by now`, tone: toneFor(d), ghostTypes };
}

