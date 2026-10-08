import { BUCKETS, MS, type Habit } from "./model";
import { addDays, diffDays, sod } from "./util";

export interface HabitStats {
  today: number;
  start: number;
  slipDays: Set<number>;
  good: number;
  longest: number;
  streak: number;
  slipToday: boolean;
}

/** Streak math. A day counts as good if it falls between start and yesterday with no slip. */
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

export function milestoneProgress(streak: number) {
  const next = MS.find((m) => m > streak) ?? null;
  const prev = [...MS].reverse().find((m) => m <= streak) ?? 0;
  const pct = next ? (streak - prev) / (next - prev) : 1;
  return { next, prev, pct };
}

export function patterns(h: Habit, today: number) {
  const cutoff = addDays(today, -30);
  const recent = h.logs.filter((l) => l.t >= cutoff && l.type !== "note");
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
  recent.forEach((l) => {
    if (l.trigger) tc[l.trigger] = (tc[l.trigger] || 0) + 1;
  });
  const triggers = Object.entries(tc)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);
  const maxT = Math.max(1, ...triggers.map((t) => t[1]));
  const momentsIn = (a: number, b: number) =>
    h.logs.filter((l) => l.type !== "slip" && l.type !== "note" && l.t >= addDays(today, -a) && l.t < addDays(today, -b)).length;
  return {
    count: recent.length,
    buckets,
    maxB,
    peak,
    triggers,
    maxT,
    thisWk: momentsIn(7, 0),
    lastWk: momentsIn(14, 7),
    resistedAll: h.logs.filter((l) => l.type === "resisted").length,
  };
}
