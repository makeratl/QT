import type { Stored } from "./model";

const KEY = "steady-data-v1";

export function load(): Stored | null {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) ?? "null");
    if (s && Array.isArray(s.habits)) {
      return {
        v: 1,
        habits: s.habits,
        activeId: s.activeId ?? null,
        theme: s.theme ?? "system",
        reminders: s.reminders ?? { aff: true, eve: false },
      };
    }
  } catch {
    /* corrupt or unavailable storage: start fresh */
  }
  return null;
}

export function save(data: Stored) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    /* storage full or blocked */
  }
}
