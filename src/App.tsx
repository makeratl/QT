import { useSteady, useResolvedTheme, type Tab } from "./store";
import { ChevronDown } from "./components/bits";
import { Today } from "./components/Today";
import { Progress } from "./components/Progress";
import { Settings } from "./components/Settings";
import { Sheets } from "./components/Sheets";
import { Onboarding, UrgeSurf } from "./components/Overlays";

const TABS: [Tab, string][] = [["today", "Today"], ["progress", "Progress"], ["settings", "Settings"]];

export function App() {
  const s = useSteady();
  useResolvedTheme(s.theme);
  const h = s.habit;

  return (
    <div className="frame">
      <div className="app">
        {h && (
          <>
            <main className="scroll">
              <div className="header">
                {s.tab !== "settings" ? (
                  <>
                    <button className="switcher" onClick={() => s.setSheet("switch")} aria-haspopup="dialog">
                      <span>{h.name}</span>
                      <ChevronDown />
                    </button>
                    <span className="muted" style={{ font: "600 14px 'Nunito',sans-serif" }}>
                      {new Date().toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })}
                    </span>
                  </>
                ) : (
                  <h1 style={{ margin: 0, font: "300 32px/1 'Nunito',sans-serif", letterSpacing: "-0.02em" }}>Settings</h1>
                )}
              </div>
              {s.tab === "today" && <Today habit={h} />}
              {s.tab === "progress" && <Progress habit={h} />}
              {s.tab === "settings" && <Settings />}
            </main>

            <nav className="tabbar">
              {TABS.map(([k, label]) => (
                <button key={k} aria-current={s.tab === k ? "page" : undefined} onClick={() => s.setTab(k)}>
                  {label}
                </button>
              ))}
            </nav>

            {s.flash && (
              <div className="toast" role="status">
                <span style={{ flex: 1, font: "700 14px/1.35 'Nunito',sans-serif" }}>{s.flash.text}</span>
                {s.flash.action && <button onClick={s.flashAction}>{s.flash.action}</button>}
              </div>
            )}

            <Sheets habit={h} />
            <UrgeSurf habit={h} />
          </>
        )}
        <Onboarding />
      </div>
    </div>
  );
}
