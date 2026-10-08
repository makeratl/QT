import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { FLASH, type BuildQuick, type Goal, type Habit, type HabitKind, type Log, type LogType, type Measure, type Preset, type QuickType, type Reminders, type ThemePref } from "./lib/model";
import { measureOf, withUnit } from "./lib/calc";
import { load, save } from "./lib/storage";
import { seedHabits } from "./lib/seed";
import { addDays, plural, sod, uid, vibrate } from "./lib/util";

export type Tab = "today" | "progress" | "settings";
export type PTab = "calendar" | "milestones" | "patterns";
export type SheetKind = "switch" | "moments" | "detail" | "slip" | "note" | "edit" | "entry";
export type StartMode = "today" | "yesterday" | "earlier";

export interface Flash {
  text: string;
  action: "Ride it out" | "Add detail" | "Start session" | "Add reason" | null;
  logId?: string;
}
export interface Surf {
  elapsed: number;
  started: boolean;
  done: boolean;
}
export type ObStep = "kind" | "pick" | "why" | "start" | "goal" | "measure";
export const OB_STEPS: Record<HabitKind, ObStep[]> = {
  quit: ["kind", "pick", "why", "start"],
  build: ["kind", "pick", "why", "goal"],
  track: ["kind", "pick", "measure"],
};
export interface Onboard {
  step: number; // index into OB_STEPS[kind]
  kind: HabitKind;
  preset: Preset | null;
  goal: Goal;
  measure: Measure;
  custom: string;
  why: string;
  startMode: StartMode;
  daysAgo: number;
}

const newOb = (): Onboard => ({ step: 0, kind: "quit", preset: null, goal: { per: "day", times: 1 }, measure: { mode: "count", unit: "times", unitOne: "time", agg: "sum" }, custom: "", why: "", startMode: "today", daysAgo: 3 });

// `?demo` previews sample data without touching what's stored on this device.
const DEMO = new URLSearchParams(location.search).has("demo");

function initialData() {
  if (DEMO) return { habits: seedHabits(), activeId: "h1" as string | null, theme: "system" as ThemePref, reminders: { aff: true, eve: false } };
  const s = load();
  return s ?? { habits: [] as Habit[], activeId: null as string | null, theme: "system" as ThemePref, reminders: { aff: true, eve: false } };
}

function useSteadyState() {
  const [data] = useState(initialData);
  const [habits, setHabits] = useState<Habit[]>(data.habits);
  const [activeId, setActiveId] = useState<string | null>(data.activeId);
  const [theme, setTheme] = useState<ThemePref>(data.theme);
  const [reminders, setReminders] = useState<Reminders>(data.reminders);

  const [tab, setTab] = useState<Tab>("today");
  const [ptab, setPtab] = useState<PTab>("calendar");
  const [sheet, setSheet] = useState<SheetKind | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [flash, setFlash] = useState<Flash | null>(null);
  const [surf, setSurf] = useState<Surf | null>(null);
  const [ob, setOb] = useState<Onboard | null>(data.habits.length ? null : newOb());
  const [calOffset, setCalOffset] = useState(0);
  const [, setTick] = useState(0);

  const flashTimer = useRef<number>(undefined);
  const surfInterval = useRef<number>(undefined);
  const surfStart = useRef<number>(undefined);

  const habit = habits.find((h) => h.id === activeId) ?? habits[0] ?? null;

  useEffect(() => {
    if (!DEMO) save({ v: 1, habits, activeId, theme, reminders });
  }, [habits, activeId, theme, reminders]);

  // Re-render when the app comes back to the foreground so the day rolls over.
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "visible") setTick((n) => n + 1);
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      clearTimeout(flashTimer.current);
      clearInterval(surfInterval.current);
      clearTimeout(surfStart.current);
    };
  }, []);

  const updateHabitById = useCallback((id: string, fn: (h: Habit) => Habit) => setHabits((hs) => hs.map((h) => (h.id === id ? fn(h) : h))), []);

  const showFlash = useCallback((text: string, action: Flash["action"] = null, logId?: string) => {
    clearTimeout(flashTimer.current);
    setFlash({ text, action, logId });
    flashTimer.current = window.setTimeout(() => setFlash(null), 4200);
  }, []);

  const log = (type: LogType, extra: Partial<Log> = {}): Log | null => {
    if (!habit) return null;
    const l: Log = { id: uid(), t: Date.now(), type, trigger: null, intensity: null, note: "", ...extra };
    updateHabitById(habit.id, (h) => ({ ...h, logs: [...h.logs, l] }));
    vibrate();
    return l;
  };

  const quick = (type: QuickType | BuildQuick) => {
    const l = log(type);
    if (!l) return;
    const msgs = FLASH[type];
    const action = type === "urge" ? "Ride it out" : type === "resist" ? "Start session" : type === "skip" ? "Add reason" : "Add detail";
    showFlash(msgs[Math.floor(Math.random() * msgs.length)], action, l.id);
  };

  /** Track: log an entry. Counts default to 1. */
  const addEntry = (value: number) => {
    if (!habit) return;
    const l = log("entry", { value });
    if (l) showFlash(`Logged ${withUnit(measureOf(habit), value)}.`, "Add detail", l.id);
  };

  /** Track: remove today's most recent entry. */
  const undoLast = () => {
    if (!habit) return;
    const today = new Date().setHours(0, 0, 0, 0);
    const last = habit.logs.filter((l) => l.type === "entry" && l.t >= today).sort((a, b) => b.t - a.t)[0];
    if (!last) return;
    removeLog(last.id);
    showFlash(`Removed ${withUnit(measureOf(habit), last.value ?? 1)}.`);
  };

  const patchLog = (id: string, patch: Partial<Log>) => {
    if (!habit) return;
    updateHabitById(habit.id, (h) => ({ ...h, logs: h.logs.map((l) => (l.id === id ? { ...l, ...patch } : l)) }));
  };

  const removeLog = (id: string) => {
    if (!habit) return;
    updateHabitById(habit.id, (h) => ({ ...h, logs: h.logs.filter((l) => l.id !== id) }));
  };

  const openSurf = () => {
    clearInterval(surfInterval.current);
    clearTimeout(surfStart.current);
    setSurf({ elapsed: 0, started: false, done: false });
    setSheet(null);
    surfStart.current = window.setTimeout(() => setSurf((s) => (s ? { ...s, started: true } : s)), 80);
    surfInterval.current = window.setInterval(() => setSurf((s) => (s && !s.done ? { ...s, elapsed: s.elapsed + 1 } : s)), 1000);
  };
  const finishSurf = () => {
    clearInterval(surfInterval.current);
    if (habit?.kind === "build") log("done", { value: Math.max(1, Math.round((surf?.elapsed ?? 0) / 60)), note: "" });
    else log("resisted", { note: "Rode it out with breathing" });
    setSurf((s) => (s ? { ...s, done: true } : s));
  };
  const closeSurf = () => {
    clearInterval(surfInterval.current);
    setSurf(null);
  };

  const flashAction = () => {
    if (!flash) return;
    clearTimeout(flashTimer.current);
    setFlash(null);
    if (flash.action === "Ride it out" || flash.action === "Start session") openSurf();
    else if (flash.logId) {
      setDetailId(flash.logId);
      setSheet("detail");
    }
  };

  const obNext = () => {
    if (!ob) return;
    const steps = OB_STEPS[ob.kind];
    const step = steps[ob.step];
    if (step === "pick" && (!ob.preset || (ob.preset.custom && !ob.custom.trim()))) return;
    if (step === "measure" && !ob.measure.unit.trim()) return;
    if (ob.step < steps.length - 1) {
      setOb({ ...ob, step: ob.step + 1 });
      return;
    }
    const preset = ob.preset!;
    const days = ob.kind === "quit" ? (ob.startMode === "today" ? 0 : ob.startMode === "yesterday" ? 1 : ob.daysAgo) : 0;
    const h: Habit = {
      id: uid(),
      kind: ob.kind,
      name: preset.custom ? ob.custom.trim() : preset.name,
      label: preset.label,
      why: ob.kind === "track" ? "" : ob.why.trim(),
      start: addDays(sod(Date.now()), -days),
      logs: [],
      ...(ob.kind === "build" ? { goal: ob.goal } : {}),
      ...(ob.kind === "track" ? { measure: { ...ob.measure, unit: ob.measure.unit.trim() } } : {}),
    };
    setHabits((hs) => [...hs, h]);
    setActiveId(h.id);
    setOb(null);
    setTab("today");
    setSheet(null);
    showFlash(
      ob.kind === "build" ? "You're set. The first one is the hardest — and the best."
      : ob.kind === "track" ? "Ready. Tap whenever there's something to log."
      : days === 0 ? "Day one. We're right here with you." : `${plural(days, "day")} already. Let's keep going.`,
    );
  };

  const deleteHabit = (id: string) => {
    const rest = habits.filter((x) => x.id !== id);
    setHabits(rest);
    setActiveId(rest.find((x) => x.id === activeId) ? activeId : (rest[0]?.id ?? null));
    setSheet(null);
    if (!rest.length) {
      setOb(newOb());
      setTab("today");
    }
  };

  const eraseAll = () => {
    if (DEMO) {
      setHabits(seedHabits());
      setActiveId("h1");
      setCalOffset(0);
      setTab("today");
      showFlash("Sample data restored.");
      return;
    }
    setHabits([]);
    setActiveId(null);
    setOb(newOb());
    setTab("today");
  };

  return {
    demo: DEMO,
    habits, habit, activeId, theme, reminders,
    tab, ptab, sheet, detailId, editId, flash, surf, ob, calOffset,
    setActiveId, setTheme, setReminders, setTab, setPtab, setSheet, setDetailId, setEditId, setOb, setCalOffset,
    updateHabitById, showFlash, log, quick, addEntry, undoLast, patchLog, removeLog,
    openSurf, finishSurf, closeSurf, flashAction,
    startOnboarding: () => {
      setOb(newOb());
      setSheet(null);
    },
    obNext, deleteHabit, eraseAll,
  };
}

export type Steady = ReturnType<typeof useSteadyState>;
const Ctx = createContext<Steady | null>(null);

export function SteadyProvider({ children }: { children: ReactNode }) {
  const value = useSteadyState();
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSteady() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useSteady outside provider");
  return v;
}

/** Resolves the theme preference against the OS setting and applies it to <html>. */
export function useResolvedTheme(pref: ThemePref) {
  const mq = useMemo(() => window.matchMedia?.("(prefers-color-scheme: dark)"), []);
  const [sysDark, setSysDark] = useState(() => !!mq?.matches);
  useEffect(() => {
    if (!mq) return;
    const on = () => setSysDark(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [mq]);
  const resolved = pref === "system" ? (sysDark ? "dark" : "light") : pref;
  useEffect(() => {
    document.documentElement.dataset.theme = resolved;
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", resolved === "dark" ? "#121615" : "#f3f1ec");
  }, [resolved]);
  return resolved;
}
