import { calcBuild } from "../lib/calc";
import { KIND_COPY, PRESETS, PROMPTS, SESSION_PROMPTS, URGE_MINUTES, WHY_IDEAS, WHY_IDEAS_BUILD, type HabitKind, type Habit, type Measure } from "../lib/model";
import { plural, sod } from "../lib/util";
import { OB_STEPS, useSteady, type Onboard, type StartMode } from "../store";
import { Seg } from "./bits";
import { GoalPicker, Stepper } from "./Sheets";

const clock = (sec: number) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;

/** Full-screen breathing overlay: urge surfing for quit habits, a session timer for build habits. */
export function UrgeSurf({ habit }: { habit: Habit }) {
  const s = useSteady();
  const surf = s.surf;
  if (!surf) return null;
  const session = habit.kind === "build";
  const phaseIn = surf.started && surf.elapsed % 10 < 4;
  const left = Math.max(0, URGE_MINUTES * 60 - surf.elapsed);
  const today = sod(Date.now());

  let doneTitle: string, doneLine: string;
  if (session) {
    const b = calcBuild(habit);
    const lastDone = habit.logs.filter((l) => l.type === "done").sort((a, b) => b.t - a.t)[0];
    const mins = lastDone?.value ?? 1;
    doneTitle = "Session done.";
    doneLine = `${plural(mins, "minute")} logged. ${b.per === "day" ? (b.todayMet ? "That's today taken care of." : "") : `That's ${b.weekCount} of ${b.times} this week.`}`;
  } else {
    const resistedToday = habit.logs.filter((l) => l.type === "resisted" && sod(l.t) === today).length;
    doneTitle = "You rode it out.";
    doneLine = `That's ${plural(resistedToday, "urge")} ridden out today. Each one makes the next a little easier.`;
  }

  const phase = !surf.started ? "Get comfortable" : phaseIn ? "Breathe in" : "Breathe out";
  const prompts = session ? SESSION_PROMPTS : PROMPTS;
  const prompt = session || left > 0 ? prompts[Math.floor(surf.elapsed / 20) % prompts.length] : "You stayed with it. Notice how it feels now.";

  return (
    <div className="overlay surf" role="dialog" aria-modal="true" aria-label={session ? "Session" : "Riding it out"}>
      <div style={{ alignSelf: "stretch", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ font: "800 12px 'Nunito',sans-serif", letterSpacing: ".08em", textTransform: "uppercase", opacity: 0.8 }}>{session ? habit.name : "Riding it out"}</span>
        <button onClick={s.closeSurf} style={{ height: 36, padding: "0 14px", borderRadius: 999, background: "rgba(255,255,255,.14)", font: "700 14px 'Nunito',sans-serif" }}>{surf.done || !session ? "Close" : "Cancel"}</button>
      </div>
      {!surf.done ? (
        <>
          <div style={{ flex: 1, minHeight: 12 }} />
          <div style={{ position: "relative", width: 260, height: 260, flex: "none" }}>
            <div style={{ position: "absolute", inset: 0, borderRadius: "50%", boxShadow: "inset 0 0 0 1.5px var(--on-teal)", opacity: 0.35 }} />
            <div className="breath" style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "var(--on-teal)", opacity: 0.16, transform: `scale(${phaseIn ? 1 : 0.5})`, transition: `transform ${phaseIn ? 4 : 6}s ease-in-out` }} />
            <div aria-live="polite" style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4 }}>
              {session ? (
                <>
                  <span style={{ font: "300 56px/1 'Nunito',sans-serif", letterSpacing: "-0.03em", fontVariantNumeric: "tabular-nums" }}>{clock(surf.elapsed)}</span>
                  <span style={{ font: "700 14px 'Nunito',sans-serif", opacity: 0.8 }}>{phase}</span>
                </>
              ) : (
                <>
                  <span style={{ font: "300 32px 'Nunito',sans-serif" }}>{phase}</span>
                  <span style={{ font: "700 14px 'Nunito',sans-serif", opacity: 0.8 }}>{left > 0 ? clock(left) : "Take all the time you need"}</span>
                </>
              )}
            </div>
          </div>
          <p style={{ margin: "32px 0 0", font: "500 19px/1.45 'Nunito',sans-serif", textAlign: "center", textWrap: "balance", minHeight: 56 }}>{prompt}</p>
          {habit.why.trim() && <p style={{ margin: "14px 0 0", font: "500 14px/1.45 'Nunito',sans-serif", textAlign: "center", opacity: 0.8, textWrap: "balance" }}>Remember why: {habit.why}</p>}
          <div style={{ flex: 1, minHeight: 12 }} />
          <button className="big-btn" onClick={s.finishSurf} style={{ background: "var(--on-teal)", color: "var(--teal)" }}>{session ? "Finish session" : "The urge has passed"}</button>
        </>
      ) : (
        <>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: 16, textAlign: "center" }}>
            <div style={{ position: "relative", width: 120, height: 120 }}>
              <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "rgba(255,255,255,.14)" }} />
              <div style={{ position: "absolute", inset: 30, borderRadius: "50%", boxShadow: "inset 0 0 0 3px var(--on-teal)" }} />
            </div>
            <span style={{ font: "300 40px/1.1 'Nunito',sans-serif", letterSpacing: "-0.02em" }}>{doneTitle}</span>
            <span style={{ font: "500 17px/1.5 'Nunito',sans-serif", opacity: 0.88, maxWidth: 290, textWrap: "pretty" }}>{doneLine}</span>
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

const fieldStyle = { height: 52, padding: "0 16px", borderRadius: 16, background: "var(--surface)", font: "600 16px 'Nunito',sans-serif" } as const;

function RadioRows<K extends string>({ rows, value, onPick }: { rows: [K, string, string][]; value: K; onPick: (k: K) => void }) {
  return (
    <div className="group" style={{ borderRadius: 22 }}>
      {rows.map(([k, label, sub]) => (
        <button key={k} role="radio" aria-checked={value === k} onClick={() => onPick(k)} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", background: "var(--surface)", textAlign: "left" }}>
          <span className={"radio" + (value === k ? " on" : "")} />
          <span className="row-text">
            <span className="row-title">{label}</span>
            <span className="row-sub">{sub}</span>
          </span>
        </button>
      ))}
    </div>
  );
}

export function Onboarding() {
  const s = useSteady();
  const ob = s.ob;
  if (!ob) return null;
  const set = (patch: Partial<Onboard>) => s.setOb((o) => (o ? { ...o, ...patch } : o));
  const setMeasure = (patch: Partial<Measure>) => set({ measure: { ...ob.measure, ...patch } });
  const steps = OB_STEPS[ob.kind];
  const step = steps[ob.step];
  const valid = step === "pick" ? !!ob.preset && (!ob.preset.custom || !!ob.custom.trim()) : step === "measure" ? !!ob.measure.unit.trim() : true;
  const hasHabits = s.habits.length > 0;
  const back = () => {
    if (ob.step > 0) set({ step: ob.step - 1 });
    else if (hasHabits) s.setOb(null);
  };
  const last = ob.step === steps.length - 1;
  const nextLabel = last ? "Start tracking" : step === "why" && !ob.why.trim() ? "Skip for now" : "Continue";

  return (
    <div className="overlay ob">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 36, flex: "none" }}>
        <button className="outline" onClick={back} style={{ height: 36, padding: "0 14px", borderRadius: 999, font: "700 14px 'Nunito',sans-serif", visibility: ob.step > 0 || hasHabits ? "visible" : "hidden" }}>
          {ob.step > 0 ? "Back" : "Cancel"}
        </button>
        <div style={{ display: "flex", gap: 6 }} aria-label={`Step ${ob.step + 1} of ${steps.length}`}>
          {steps.map((_, i) => (
            <span key={i} style={{ width: i === ob.step ? 24 : 8, height: 8, borderRadius: 8, background: i <= ob.step ? "var(--teal)" : "var(--line)", transition: "width .3s" }} />
          ))}
        </div>
        <span style={{ width: 60 }} />
      </div>

      {step === "kind" && (
        <>
          <H1 title="What would you like to work on?" sub="You can add more of any kind later." />
          <RadioRows<HabitKind>
            rows={(["quit", "build", "track"] as HabitKind[]).map((k) => [k, KIND_COPY[k].title, KIND_COPY[k].sub])}
            value={ob.kind}
            onPick={(kind) => set({ kind, preset: null, custom: "" })}
          />
        </>
      )}

      {step === "pick" && (
        <>
          <H1 title={KIND_COPY[ob.kind].pick} sub={KIND_COPY[ob.kind].pickSub} />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {PRESETS[ob.kind].map((p) => (
              <button
                key={p.name}
                className="chip"
                aria-pressed={ob.preset?.name === p.name}
                onClick={() => set({ preset: p, ...(p.goal ? { goal: p.goal } : {}), ...(p.measure ? { measure: p.measure } : {}) })}
                style={{ height: 50, padding: "0 20px", font: "700 16px 'Nunito',sans-serif", background: ob.preset?.name === p.name ? undefined : "var(--surface)", transition: "background .15s" }}
              >
                {p.name}
              </button>
            ))}
          </div>
          {ob.preset?.custom && (
            <input className="field" autoFocus value={ob.custom} onChange={(e) => set({ custom: e.target.value })} placeholder={ob.kind === "quit" ? "Name it — e.g. Late-night snacking" : ob.kind === "build" ? "Name it — e.g. Practice guitar" : "Name it — e.g. Headaches"} style={fieldStyle} />
          )}
        </>
      )}

      {step === "why" && (
        <>
          <H1 title={ob.kind === "build" ? "Why do you want this?" : "Why does this matter to you?"} sub="We'll remind you of this on the hard days." />
          <textarea className="field" value={ob.why} onChange={(e) => set({ why: e.target.value })} rows={4} placeholder="In your own words…" style={{ padding: "14px 16px", borderRadius: 18, background: "var(--surface)", font: "500 17px/1.5 'Nunito',sans-serif" }} />
          <div className="chips">
            {(ob.kind === "build" ? WHY_IDEAS_BUILD : WHY_IDEAS).map((w) => (
              <button key={w} onClick={() => set({ why: ob.why ? ob.why.replace(/\.?\s*$/, "") + ". " + w + "." : w + "." })} style={{ height: 38, padding: "0 14px", borderRadius: 999, background: "var(--teal-tint)", color: "var(--teal)", font: "700 14px 'Nunito',sans-serif" }}>
                {w}
              </button>
            ))}
          </div>
        </>
      )}

      {step === "start" && (
        <>
          <H1 title="When did you start?" sub="Already a few days in? Count them — they're yours." />
          <RadioRows<StartMode>
            rows={[["today", "Today", "Starting fresh right now"], ["yesterday", "Yesterday", "Today is day one"], ["earlier", "Earlier", "I've already got some days behind me"]]}
            value={ob.startMode}
            onPick={(startMode) => set({ startMode })}
          />
          {ob.startMode === "earlier" && <Stepper value={ob.daysAgo} onChange={(daysAgo) => set({ daysAgo })} min={2} max={365} caption="days ago" />}
        </>
      )}

      {step === "goal" && (
        <>
          <H1 title="How often?" sub="Pick something you can keep up on a busy week." />
          <GoalPicker goal={ob.goal} onChange={(goal) => set({ goal })} />
        </>
      )}

      {step === "measure" && (
        <>
          <H1 title="How do you want to log it?" sub="You can change the unit later." />
          <RadioRows<Measure["mode"]>
            rows={[["count", "Count it", "One tap adds one — cups, glasses, times"], ["amount", "Enter an amount", "Type a number — hours, km, kg"]]}
            value={ob.measure.mode}
            onPick={(mode) => setMeasure(mode === "count" ? { mode, agg: "sum" } : { mode })}
          />
          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span className="muted" style={{ font: "700 13px 'Nunito',sans-serif" }}>Unit</span>
            <input className="field" value={ob.measure.unit} onChange={(e) => setMeasure({ unit: e.target.value, unitOne: undefined })} placeholder="e.g. glasses" style={fieldStyle} />
          </label>
          {ob.measure.mode === "amount" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <span className="muted" style={{ font: "700 13px 'Nunito',sans-serif" }}>When you log more than once a day</span>
              <Seg<Measure["agg"]> options={[["sum", "Add them up"], ["latest", "Keep the latest"]]} value={ob.measure.agg} onChange={(agg) => setMeasure({ agg })} height={40} />
            </div>
          )}
        </>
      )}

      <div style={{ flex: 1 }} />
      <button className="big-btn" onClick={s.obNext} disabled={!valid} style={{ background: "var(--teal)", color: "var(--on-teal)", opacity: valid ? 1 : 0.4, transition: "opacity .2s", cursor: valid ? "pointer" : "default" }}>
        {nextLabel}
      </button>
    </div>
  );
}
