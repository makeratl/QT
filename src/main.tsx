import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import "@fontsource/nunito/300.css";
import "@fontsource/nunito/400.css";
import "@fontsource/nunito/400-italic.css";
import "@fontsource/nunito/500.css";
import "@fontsource/nunito/600.css";
import "@fontsource/nunito/700.css";
import "@fontsource/nunito/800.css";
import "./styles.css";
import { SteadyProvider } from "./store";
import { App } from "./App";

registerSW({ immediate: true });
// Ask the browser not to evict our localStorage (iOS can clear it for idle PWAs).
navigator.storage?.persist?.().catch(() => {});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <SteadyProvider>
      <App />
    </SteadyProvider>
  </StrictMode>,
);
