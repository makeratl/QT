import type { CSSProperties } from "react";
import { TYPES, type LogType } from "../lib/model";

export function Glyph({ type, style }: { type: LogType; style?: CSSProperties }) {
  const T = TYPES[type];
  return <span className="glyph" style={{ width: T.size, height: T.size, borderRadius: T.radius, background: T.bg, boxShadow: T.ring, ...style }} />;
}

export const ChevronDown = () => (
  <svg width="10" height="6" viewBox="0 0 10 6" style={{ flex: "none" }} aria-hidden>
    <path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
export const ChevronRight = ({ style }: { style?: CSSProperties }) => (
  <svg width="7" height="12" viewBox="0 0 7 12" style={{ flex: "none", ...style }} aria-hidden>
    <path d="M1 1l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
export const ChevronLeft = () => (
  <svg width="7" height="12" viewBox="0 0 7 12" aria-hidden>
    <path d="M6 1L1 6l5 5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export function Seg<K extends string>({ options, value, onChange, height }: { options: [K, string][]; value: K; onChange: (k: K) => void; height?: number }) {
  return (
    <div className="seg">
      {options.map(([k, label]) => (
        <button key={k} aria-pressed={value === k} onClick={() => onChange(k)} style={height ? { height } : undefined}>
          {label}
        </button>
      ))}
    </div>
  );
}

export function Chips({ options, value, onChange }: { options: string[]; value: string | null; onChange: (v: string | null) => void }) {
  return (
    <div className="chips">
      {options.map((t) => (
        <button key={t} className="chip" aria-pressed={value === t} onClick={() => onChange(value === t ? null : t)}>
          {t}
        </button>
      ))}
    </div>
  );
}
