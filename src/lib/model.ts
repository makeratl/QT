/** quit: break a habit · build: start one · track: just keep a record. */
export type HabitKind = "quit" | "build" | "track";

export type LogType =
  // quit
  | "thought" | "trigger" | "urge" | "resisted" | "slip"
  // build
  | "done" | "resist" | "skip"
  // track
  | "entry"
  // all
  | "note";
export type Intensity = 1 | 2 | 3 | 4 | 5;
export type ThemePref = "system" | "light" | "dark";

export interface Log {
  id: string;
  t: number; // epoch ms
  type: LogType;
  trigger: string | null; // quit: trigger · build: what got in the way
  intensity: Intensity | null;
  note: string;
  value?: number | null; // build: minutes · track: amount
}

export interface Goal {
  per: "day" | "week";
  times: number;
}

export interface Measure {
  mode: "count" | "amount";
  unit: string; // plural, e.g. "glasses"
  unitOne?: string; // singular, e.g. "glass"
  agg: "sum" | "latest"; // how a day's entries combine
  better?: "more" | "less" | "neither"; // which way counts as a good day; missing → "neither"
}

export interface Habit {
  id: string;
  kind?: HabitKind; // missing on data saved before kinds existed → "quit"
  name: string;
  label: string; // quit: "smoke-free"
  why: string;
  start: number; // local midnight ms
  logs: Log[];
  goal?: Goal; // build
  measure?: Measure; // track
}

export const kindOf = (h: Habit): HabitKind => h.kind ?? "quit";

export interface Reminders {
  aff: boolean;
  eve: boolean;
}

export interface Stored {
  v: 1;
  habits: Habit[];
  activeId: string | null;
  theme: ThemePref;
  reminders: Reminders;
}

export interface Glyph {
  label: string;
  size: string;
  bg: string;
  ring: string;
  radius: string;
}

export const TYPES: Record<LogType, Glyph> = {
  thought: { label: "Thought about it", size: "12px", bg: "transparent", ring: "inset 0 0 0 2px var(--teal)", radius: "50%" },
  trigger: { label: "Had a trigger", size: "14px", bg: "var(--clay-tint)", ring: "inset 0 0 0 2px var(--clay)", radius: "50%" },
  urge: { label: "Strong urge", size: "14px", bg: "var(--clay)", ring: "none", radius: "50%" },
  resisted: { label: "Resisted", size: "14px", bg: "var(--teal)", ring: "none", radius: "50%" },
  slip: { label: "Slipped", size: "12px", bg: "var(--ink)", ring: "none", radius: "50%" },
  done: { label: "Did it", size: "14px", bg: "var(--teal)", ring: "none", radius: "50%" },
  resist: { label: "Felt resistance", size: "14px", bg: "var(--clay-tint)", ring: "inset 0 0 0 2px var(--clay)", radius: "50%" },
  skip: { label: "Skipped", size: "12px", bg: "transparent", ring: "inset 0 0 0 2px var(--muted)", radius: "50%" },
  entry: { label: "Entry", size: "12px", bg: "var(--teal)", ring: "none", radius: "50%" },
  note: { label: "Note", size: "10px", bg: "var(--muted)", ring: "none", radius: "3px" },
};

export type QuickType = "thought" | "trigger" | "urge" | "resisted";
export type BuildQuick = "done" | "resist" | "skip";

export const FLASH: Record<QuickType | BuildQuick, string[]> = {
  thought: ["Noticed. That's the whole skill.", "A thought isn't an action. Nicely caught.", "Seen and named."],
  trigger: ["Good catch. Naming a trigger takes its edge off.", "Logged. Knowing your triggers is half of it."],
  urge: ["Urges peak and pass — usually within minutes.", "This one will pass too. Want company?"],
  resisted: ["You rode it out. That counts.", "Another one ridden out. It gets easier.", "That's strength, quietly practiced."],
  done: ["Done. That's how habits get built.", "You showed up. That's the hard part.", "Another one in the bank."],
  resist: ["Noticing resistance helps. It usually fades once you start.", "Logged. Starting small can help."],
  skip: ["One skip doesn't undo the rest.", "Noted. Rest is part of it too."],
};

export const AFF = [
  "Cravings are waves. You don't have to swim against them.",
  "You don't need to quit forever today. Just today.",
  "Noticing an urge is a win, not a warning.",
  "Every urge you ride out makes the next one a little smaller.",
  "Be as kind to yourself as you'd be to a good friend.",
  "Progress isn't a straight line. Keep walking.",
  "You've done hard things before. This is one more.",
];

export const AFF_BUILD = [
  "Showing up matters more than doing it perfectly.",
  "Small and steady beats big and rare.",
  "You don't have to feel like it to do it.",
  "Five minutes still counts.",
  "Missed a day? The next one is what matters.",
  "Each time you show up, it gets a little more like you.",
  "Be proud of the quiet effort.",
];

export const PROMPTS = [
  "Notice where you feel it in your body. Just notice.",
  "Urges rise, peak, and fall — usually within a few minutes.",
  "You don't have to act on it. You can just watch it.",
  "Breathe slower than the urge wants you to.",
  "It's already starting to soften.",
];

export const SESSION_PROMPTS = [
  "Settle in. There's nowhere else to be.",
  "If your mind wanders, gently come back.",
  "Steady effort. No need to rush.",
  "Notice how you feel right now.",
  "You showed up. That's the hard part.",
];

export const TRIGGERS = ["Stress", "After a meal", "Coffee", "Social", "Boredom", "Alcohol", "Driving", "Tired"];
export const BLOCKERS = ["Tired", "Busy", "Low mood", "Unwell", "Weather", "Travel", "Forgot", "Not in the mood"];

export const TRIG_PHRASE: Record<string, string> = {
  Stress: "when you're stressed",
  "After a meal": "after a meal",
  Coffee: "with coffee",
  Social: "around other people",
  Boredom: "when you're bored",
  Alcohol: "when you're drinking",
  Driving: "while driving",
  Tired: "when you're tired",
};

export const BLOCK_PHRASE: Record<string, string> = {
  Tired: "when you're tired",
  Busy: "on busy days",
  "Low mood": "when your mood is low",
  Unwell: "when you're unwell",
  Weather: "because of the weather",
  Travel: "while traveling",
  Forgot: "when it slips your mind",
  "Not in the mood": "when you're not in the mood",
};

export const INTENSITY = ["", "Faint", "Mild", "Noticeable", "Strong", "Intense"];

export interface Preset {
  name: string;
  label: string;
  custom?: boolean;
  goal?: Goal;
  measure?: Measure;
}

export const PRESETS: Record<HabitKind, Preset[]> = {
  quit: [
    { name: "Smoking", label: "smoke-free" },
    { name: "Vaping", label: "vape-free" },
    { name: "Drinking", label: "alcohol-free" },
    { name: "Sugar", label: "sugar-free" },
    { name: "Doomscrolling", label: "scroll-free" },
    { name: "Something else", label: "free", custom: true },
  ],
  build: [
    { name: "Meditation", label: "", goal: { per: "day", times: 1 } },
    { name: "Exercise", label: "", goal: { per: "week", times: 3 } },
    { name: "Reading", label: "", goal: { per: "day", times: 1 } },
    { name: "Journaling", label: "", goal: { per: "day", times: 1 } },
    { name: "Stretching", label: "", goal: { per: "day", times: 1 } },
    { name: "Something else", label: "", custom: true, goal: { per: "day", times: 1 } },
  ],
  track: [
    { name: "Water", label: "", measure: { mode: "count", unit: "glasses", unitOne: "glass", agg: "sum", better: "more" } },
    { name: "Coffee", label: "", measure: { mode: "count", unit: "cups", unitOne: "cup", agg: "sum", better: "less" } },
    { name: "Sleep", label: "", measure: { mode: "amount", unit: "hours", unitOne: "hour", agg: "sum", better: "more" } },
    { name: "Weight", label: "", measure: { mode: "amount", unit: "kg", agg: "latest", better: "neither" } },
    { name: "Steps", label: "", measure: { mode: "amount", unit: "steps", unitOne: "step", agg: "sum", better: "more" } },
    { name: "Something else", label: "", custom: true, measure: { mode: "count", unit: "times", unitOne: "time", agg: "sum", better: "neither" } },
  ],
};

export const KIND_COPY: Record<HabitKind, { title: string; sub: string; pick: string; pickSub: string }> = {
  quit: { title: "Break a habit", sub: "Let go of something", pick: "What are you ready to let go of?", pickSub: "Pick one for now. You can add more later." },
  build: { title: "Build a habit", sub: "Start something new", pick: "What do you want to make a habit?", pickSub: "Pick one for now. You can add more later." },
  track: { title: "Track something", sub: "Just keep a record", pick: "What do you want to keep track of?", pickSub: "No goals, no streaks — just the numbers." },
};

export const WHY_IDEAS = ["My health", "The people I love", "Feeling in control", "Saving money"];
export const WHY_IDEAS_BUILD = ["My health", "A calmer mind", "More energy", "Being who I want to be"];

export const MS = [1, 3, 7, 14, 30, 60, 90, 180, 365];
export const MS_NAME: Record<number, string> = { 1: "your first day", 3: "three days", 7: "one week", 14: "two weeks", 30: "one month", 60: "two months", 90: "three months", 180: "six months", 365: "one year" };
export const MS_LABEL: Record<number, string> = { 1: "1 day", 3: "3 days", 7: "1 week", 14: "2 weeks", 30: "1 month", 60: "2 months", 90: "3 months", 180: "6 months", 365: "1 year" };

/** Weekly-goal milestones, counted in weeks. */
export const MS_WEEKS = [1, 2, 4, 8, 12, 26, 52];
export const MS_WEEK_LABEL: Record<number, string> = { 1: "1 week", 2: "2 weeks", 4: "4 weeks", 8: "8 weeks", 12: "12 weeks", 26: "26 weeks", 52: "52 weeks" };

// [label, fromHour, toHour (night wraps past 24), phrase]
export const BUCKETS: [string, number, number, string][] = [
  ["Early", 5, 9, "early in the morning"],
  ["Morning", 9, 12, "mid-morning"],
  ["Midday", 12, 15, "around midday"],
  ["Afternoon", 15, 18, "in the afternoon"],
  ["Evening", 18, 21, "in the evening"],
  ["Night", 21, 29, "late at night"],
];

export const URGE_MINUTES = 2;
