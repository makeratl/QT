export const DAY = 864e5;

/** Start of the local day containing t. */
export const sod = (t: number | Date): number => {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};
export const addDays = (t: number, n: number): number => {
  const d = new Date(t);
  d.setDate(d.getDate() + n);
  return sod(d);
};
export const diffDays = (a: number, b: number): number => Math.round((sod(b) - sod(a)) / DAY);

export const fmtTime = (t: number) => new Date(t).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }).toLowerCase();

export const uid = () => Math.random().toString(36).slice(2, 10);
export const plural = (n: number, w: string, many = w + "s") => n + " " + (n === 1 ? w : many);

export const vibrate = () => {
  try {
    navigator.vibrate?.(12);
  } catch {
    /* unsupported */
  }
};
