import type { Habit, Log, LogType } from "./model";
import { addDays, sod, uid } from "./util";

/** Sample data for the `?demo` preview. Deterministic, ported from the prototype. */
export function seedHabits(): Habit[] {
  const today = sod(Date.now());
  const now = Date.now();
  let s = 11;
  const r = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  const pick = <T,>(a: T[]) => a[Math.floor(r() * a.length)];
  const hours = [7, 8, 8, 9, 12, 13, 13, 14, 17, 18, 20, 21, 22];
  const mk = (days: number, trigs: string[], density: number) => {
    const out: Log[] = [];
    for (let d = days; d >= 1; d--) {
      const n = Math.max(0, Math.round(density * (0.4 + d / days) + r() * 2 - 1));
      for (let i = 0; i < n; i++) {
        const x = r();
        const type: LogType = x < 0.42 ? "thought" : x < 0.68 ? "trigger" : x < 0.84 ? "urge" : "resisted";
        out.push({
          id: uid(),
          t: addDays(today, -d) + (pick(hours) * 60 + Math.floor(r() * 60)) * 6e4,
          type,
          trigger: type === "thought" && r() < 0.5 ? null : pick(trigs),
          intensity: (type === "urge" ? 4 + Math.round(r()) : 1 + Math.floor(r() * 3)) as Log["intensity"],
          note: "",
        });
      }
    }
    return out;
  };
  const smoke = mk(40, ["Coffee", "After a meal", "After a meal", "Stress", "Stress", "Social", "Driving", "Alcohol"], 3);
  smoke.push({ id: uid(), t: addDays(today, -13) + 21.5 * 36e5, type: "slip", trigger: "Alcohol", intensity: 5, note: "Friday drinks. One turned into three." });
  (
    [
      [8.25, "thought", "Coffee", 2],
      [12.85, "trigger", "After a meal", 3],
    ] as const
  ).forEach(([h, type, trigger, intensity]) => {
    const t = today + h * 36e5;
    if (t < now) smoke.push({ id: uid(), t, type, trigger, intensity, note: "" });
  });
  const drink = mk(6, ["Social", "Stress", "Tired", "Boredom"], 1.5);

  // Build: meditation most mornings over the past month.
  const meditate: Log[] = [];
  for (let d = 30; d >= 1; d--) {
    const x = r();
    const t = addDays(today, -d) + (7 * 60 + Math.floor(r() * 90)) * 6e4;
    if (x < 0.78) meditate.push({ id: uid(), t, type: "done", trigger: null, intensity: null, note: "", value: 5 + Math.floor(r() * 4) * 5 });
    else if (x < 0.9) meditate.push({ id: uid(), t, type: "skip", trigger: pick(["Tired", "Busy", "Not in the mood"]), intensity: null, note: "" });
    else meditate.push({ id: uid(), t, type: "resist", trigger: pick(["Tired", "Busy"]), intensity: 3, note: "" });
  }

  // Track: glasses of water through the day.
  const water: Log[] = [];
  for (let d = 20; d >= 0; d--) {
    const n = 3 + Math.floor(r() * 5);
    for (let i = 0; i < n; i++) {
      const t = addDays(today, -d) + (8 + (i * 12) / n + r()) * 36e5;
      if (t < now) water.push({ id: uid(), t, type: "entry", trigger: null, intensity: null, note: "", value: 1 });
    }
  }

  return [
    { id: "h1", name: "Smoking", label: "smoke-free", why: "I want to keep up with Maya on our Saturday runs.", start: addDays(today, -41), logs: smoke },
    { id: "h2", name: "Weeknight drinking", label: "alcohol-free", why: "Clearer mornings. Better sleep.", start: addDays(today, -6), logs: drink },
    { id: "h3", kind: "build", name: "Meditation", label: "", why: "A calmer start to the day.", start: addDays(today, -30), logs: meditate, goal: { per: "day", times: 1 } },
    { id: "h4", kind: "track", name: "Water", label: "", why: "", start: addDays(today, -20), logs: water, measure: { mode: "count", unit: "glasses", unitOne: "glass", agg: "sum", better: "more" } },
  ];
}
