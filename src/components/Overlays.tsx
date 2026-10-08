import { PRESETS, PROMPTS, URGE_MINUTES, WHY_IDEAS, type Habit } from "../lib/model";
import { plural, sod } from "../lib/util";
import { useSteady, type Onboard, type StartMode } from "../store";

export function UrgeSurf({ habit }: { habit: Habit }) {
  const s = useSteady();
  const surf = s.surf;
  if (!surf) return null;
  const total = URGE_MINUTES * 60;
  const phaseIn = surf.started && surf.elapsed % 10 < 4;
  const left = Math.max(0, total - surf.elapsed);
  const today = sod(Date.now());
  const resistedToday = habit.logs.filter((l) => l.type === "resisted" && sod(l.t) === today).length;

  return (
    <div className="overlay surf" role="dialog" aria-modal="true" aria-label="Riding it out">
      <div style={{ alignSelf: "stretch", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ font: "800 12px 'Nunito',sans-serif", letterSpacing: ".08em", textTransform: "uppercase", opacity: 0.8 }}>Riding it out</span>
        <button onClick={s.closeSurf} style={{ height: 36, padding: "0 14px", borderRadius: 999, background: "rgba(255,255,255,.14)", font: "700 14px 'Nunito',sans-serif" }}>Close</button>
      </div>
      {!surf.done ? (
        <>
          <div style={{ flex: 1, minHeight: 12 }} />
          <div style={{ position: "relative", width: 260, height: 260, flex: "none" }}>
            <div style={{ position: "absolute", inset: 0, borderRadius: "50%", boxShadow: "inset 0 0 0 1.5px var(--on-teal)", opacity: 0.35 }} />
            <div className="breath" style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "var(--on-teal)", opacity: 0.16, transform: `scale(${phaseIn ? 1 : 0.5})`, transition: `transform ${phaseIn ? 4 : 6}s ease-in-out` }} />
            <div aria-live="polite" style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4 }}>
              <span style={{ font: "300 32px 'Nunito',sans-serif" }}>{!surf.started ? "Get comfortable" : phaseIn ? "Breathe in" : "Breathe out"}</span>
              <span style={{ font: "700 14px 'Nunito',sans-serif", opacity: 0.8 }}>{left > 0 ? `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}` : "Take all the time you need"}</span>
            </div>
          </div>
          <p style={{ margin: "32px 0 0", font: "500 19px/1.45 'Nunito',sans-serif", textAlign: "center", textWrap: "balance", minHeight: 56 }}>
            {left > 0 ? PROMPTS[Math.floor(surf.elapsed / 20) % PROMPTS.length] : "You stayed with it. Notice how it feels now."}
          </p>
          {habit.why.trim() && <p style={{ margin: "14px 0 0", font: "500 14px/1.45 'Nunito',sans-serif", textAlign: "center", opacity: 0.8, textWrap: "balance" }}>Remember why: {habit.why}</p>}
          <div style={{ flex: 1, minHeight: 12 }} />
          <button className="big-btn" onClick={s.finishSurf} style={{ background: "var(--on-teal)", color: "var(--teal)" }}>The urge has passed</button>
        </>
      ) : (
        <>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: 16, textAlign: "center" }}>
            <div style={{ position: "relative", width: 120, height: 120 }}>
              <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "rgba(255,255,255,.14)" }} />
              <div style={{ position: "absolute", inset: 30, borderRadius: "50%", boxShadow: "inset 0 0 0 3px var(--on-teal)" }} />
            </div>
            <span style={{ font: "300 40px/1.1 'Nunito',sans-serif", letterSpacing: "-0.02em" }}>You rode it out.</span>
            <span style={{ font: "500 17px/1.5 'Nunito',sans-serif", opacity: 0.88, maxWidth: 290, textWrap: "pretty" }}>
              That's {plural(resistedToday, "urge")} ridden out today. Each one makes the next a little easier.
            </span>
          </div>
          <button className="big-btn" onClick={s.closeSurf} style={{ background: "var(--on-teal)", color: "var(--teal)" }}>Back to today</button>
        </>
      )}
    </div>
  );
}

const H1 = ({ title, sub }: { title: string; sub: string }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
    <span style={{ font: "300 34px/1.1 'Nunito',sans-serif", letterSpacing: "-0.02em", textWrap: "balance" }}>{title}</span>
    <span className="muted" style={{ font: "500 15px 'Nunito',sans-serif" }}>{sub}</span>
  </div>
);

export function Onboarding() {
  const s = useSteady();
  const ob = s.ob;
  if (!ob) return null;
  const set = (patch: Partial<Onboard>) => s.setOb((o) => (o ? { ...o, ...patch } : o));
  const valid = ob.step === 1 ? !!ob.preset && (!ob.preset.custom || !!ob.custom.trim()) : true;
  const hasHabits = s.habits.length > 0;
  const back = () => {
    if (ob.step > 1) set({ step: (ob.step - 1) as Onboard["step"] });
    else if (hasHabits) s.setOb(null);
  };

  return (
    <div className="overlay ob">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 36, flex: "none" }}>
        <button className="outline" onClick={back} style={{ height: 36, padding: "0 14px", borderRadius: 999, font: "700 14px 'Nunito',sans-serif", visibility: ob.step > 1 || hasHabits ? "visible" : "hidden" }}>
          {ob.step > 1 ? "Back" : "Cancel"}
        </button>
        <div style={{ display: "flex", gap: 6 }} aria-label={`Step ${ob.step} of 3`}>
          {[1, 2, 3].map((i) => (
            <span key={i} style={{ width: i === ob.step ? 24 : 8, height: 8, borderRadius: 8, background: i <= ob.step ? "var(--teal)" : "var(--line)", transition: "width .3s" }} />
          ))}
        </div>
        <span style={{ width: 60 }} />
      </div>

      {ob.step === 1 && (
        <>
          <H1 title="What are you ready to let go of?" sub="Pick one for now. You can add more later." />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {PRESETS.map((p) => (
              <button key={p.name} className="chip" aria-pressed={ob.preset?.name === p.name} onClick={() => set({ preset: p })} style={{ height: 50, padding: "0 20px", font: "700 16px 'Nunito',sans-serif", background: ob.preset?.name === p.name ? undefined : "var(--surface)", transition: "background .15s" }}>
                {p.name}
              </button>
            ))}
          </div>
          {ob.preset?.custom && (
            <input className="field" autoFocus value={ob.custom} onChange={(e) => set({ custom: e.target.value })} placeholder="Name it — e.g. Late-night snacking" style={{ height: 52, padding: "0 16px", borderRadius: 16, background: "var(--surface)", font: "600 16px 'Nunito',sans-serif" }} />
          )}
        </>
      )}

      {ob.step === 2 && (
        <>
          <H1 title="Why does this matter to you?" sub="We'll remind you of this on the hard days." />
          <textarea className="field" value={ob.why} onChange={(e) => set({ why: e.target.value })} rows={4} placeholder="In your own words…" style={{ padding: "14px 16px", borderRadius: 18, background: "var(--surface)", font: "500 17px/1.5 'Nunito',sans-serif" }} />
          <div className="chips">
            {WHY_IDEAS.map((w) => (
              <button key={w} onClick={() => set({ why: ob.why ? ob.why.replace(/\.?\s*$/, "") + ". " + w + "." : w + "." })} style={{ height: 38, padding: "0 14px", borderRadius: 999, background: "var(--teal-tint)", color: "var(--teal)", font: "700 14px 'Nunito',sans-serif" }}>
                {w}
              </button>
            ))}
          </div>
        </>
      )}

      {ob.step === 3 && (
        <>
          <H1 title="When did you start?" sub="Already a few days in? Count them — they're yours." />
          <div className="group" style={{ borderRadius: 22 }}>
            {([["today", "Today", "Starting fresh right now"], ["yesterday", "Yesterday", "Today is day one"], ["earlier", "Earlier", "I've already got some days behind me"]] as [StartMode, string, string][]).map(([k, label, sub]) => (
              <button key={k} role="radio" aria-checked={ob.startMode === k} onClick={() => set({ startMode: k })} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", background: "var(--surface)", textAlign: "left" }}>
                <span className={"radio" + (ob.startMode === k ? " on" : "")} />
                <span className="row-text">
                  <span className="row-title">{label}</span>
                  <span className="row-sub">{sub}</span>
                </span>
              </button>
            ))}
          </div>
          {ob.startMode === "earlier" && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 24 }}>
              <button className="outline" aria-label="Fewer days" onClick={() => set({ daysAgo: Math.max(2, ob.daysAgo - 1) })} style={{ width: 52, height: 52, borderRadius: "50%", font: "400 28px/1 'Nunito',sans-serif" }}>−</button>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 110 }}>
                <span style={{ font: "300 60px/1 'Nunito',sans-serif", letterSpacing: "-0.03em" }}>{ob.daysAgo}</span>
                <span className="muted" style={{ font: "700 14px 'Nunito',sans-serif" }}>days ago</span>
              </div>
              <button className="outline" aria-label="More days" onClick={() => set({ daysAgo: Math.min(365, ob.daysAgo + 1) })} style={{ width: 52, height: 52, borderRadius: "50%", font: "400 28px/1 'Nunito',sans-serif" }}>+</button>
            </div>
          )}
        </>
      )}

      <div style={{ flex: 1 }} />
      <button className="big-btn" onClick={s.obNext} disabled={!valid} style={{ background: "var(--teal)", color: "var(--on-teal)", opacity: valid ? 1 : 0.4, transition: "opacity .2s", cursor: valid ? "pointer" : "default" }}>
        {ob.step === 3 ? "Start tracking" : ob.step === 2 && !ob.why.trim() ? "Skip for now" : "Continue"}
      </button>
    </div>
  );
}
