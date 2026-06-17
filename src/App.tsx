import { useState } from "react";
import Orb from "./components/Orb";
import SystemHeader from "./components/SystemHeader";
import { auronStates, type AuronState } from "./types/auron";

function App() {
  const [state, setState] = useState<AuronState>("idle");

  return (
    <main className="app-shell">
      <div className="app-background" aria-hidden="true">
        <div className="app-gradient app-gradient-primary" />
        <div className="app-gradient app-gradient-secondary" />
        <div className="app-grid" />
        <div className="app-noise" />
      </div>

      <section className="auron-stage" aria-label="AURON interface">
        <SystemHeader />
        <Orb state={state} />

        <div className="auron-status-panel">
          <div className="auron-status-line">
            <span className="auron-status-line__label">Status</span>
            <strong>{state.toUpperCase()}</strong>
          </div>

          <div className="auron-state-switcher" aria-label="AURON state controls">
            {auronStates.map((nextState) => (
              <button
                key={nextState}
                type="button"
                className={nextState === state ? "is-active" : ""}
                onClick={() => setState(nextState)}
              >
                {nextState}
              </button>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

export default App;
