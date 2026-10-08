export type LogType = "thought" | "trigger" | "urge" | "resisted" | "slip" | "note";
export type Intensity = 1 | 2 | 3 | 4 | 5;
export type ThemePref = "system" | "light" | "dark";

export interface Log {
  id: string;
  t: number; // epoch ms
  type: LogType;
  trigger: string | null;
  intensity: Intensity | null;
  note: string;
}

export interface Habit {
  id: string;
  name: string;
  label: string; // e.g. "smoke-free"
  why: string;
  start: number; // local midnight ms
  logs: Log[];
}

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
  note: { label: "Note", size: "10px", bg: "var(--muted)", ring: "none", radius: "3px" },
};

export type QuickType = "thought" | "trigger" | "urge" | "resisted";

export const FLASH: Record<QuickType, string[]> = {
  thought: ["Noticed. That's the whole skill.", "A thought isn't an action. Nicely caught.", "Seen and named."],
  trigger: ["Good catch. Naming a trigger takes its edge off.", "Logged. Knowing your triggers is half of it."],
  urge: ["Urges peak and pass — usually within minutes.", "This one will pass too. Want company?"],
  resisted: ["You rode it out. That counts.", "Another one ridden out. It gets easier.", "That's strength, quietly practiced."],
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

export const PROMPTS = [
  "Notice where you feel it in your body. Just notice.",
  "Urges rise, peak, and fall — usually within a few minutes.",
  "You don't have to act on it. You can just watch it.",
  "Breathe slower than the urge wants you to.",
  "It's already starting to soften.",
];

export const TRIGGERS = ["Stress", "After a meal", "Coffee", "Social", "Boredom", "Alcohol", "Driving", "Tired"];

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

export const INTENSITY = ["", "Faint", "Mild", "Noticeable", "Strong", "Intense"];

export interface Preset {
  name: string;
  label: string;
  custom?: boolean;
}

export const PRESETS: Preset[] = [
  { name: "Smoking", label: "smoke-free" },
  { name: "Vaping", label: "vape-free" },
  { name: "Drinking", label: "alcohol-free" },
  { name: "Sugar", label: "sugar-free" },
  { name: "Doomscrolling", label: "scroll-free" },
  { name: "Something else", label: "free", custom: true },
];

export const WHY_IDEAS = ["My health", "The people I love", "Feeling in control", "Saving money"];

export const MS = [1, 3, 7, 14, 30, 60, 90, 180, 365];
export const MS_NAME: Record<number, string> = { 1: "your first day", 3: "three days", 7: "one week", 14: "two weeks", 30: "one month", 60: "two months", 90: "three months", 180: "six months", 365: "one year" };
export const MS_LABEL: Record<number, string> = { 1: "1 day", 3: "3 days", 7: "1 week", 14: "2 weeks", 30: "1 month", 60: "2 months", 90: "3 months", 180: "6 months", 365: "1 year" };

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
