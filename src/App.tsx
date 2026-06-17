import { useState } from "react";
import CommandInput from "./components/CommandInput";
import FloatingPanel from "./components/FloatingPanel";
import Orb from "./components/Orb";
import SystemHeader from "./components/SystemHeader";
import { auronStates, type AuronState } from "./types/auron";
import { routeCommand } from "./core/commandRouter";

const helpCommands = [
  "estado idle",
  "estado ouvindo",
  "estado pensando",
  "estado falando",
  "estado erro",
  "abrir mapa",
  "fechar mapa",
  "ajuda",
  "limpar"
];

function App() {
  const [state, setState] = useState<AuronState>("idle");
  const [responseMessage, setResponseMessage] = useState(
    "Aguardando comando local."
  );
  const [showHelp, setShowHelp] = useState(false);
  const [showMap, setShowMap] = useState(false);

  function handleStateChange(nextState: AuronState) {
    setState(nextState);
    setResponseMessage(`Estado alterado para ${nextState.toUpperCase()}.`);
  }

  function handleCommand(command: string) {
    const result = routeCommand(command);

    switch (result.type) {
      case "set-state":
        setState(result.state);
        setResponseMessage(result.message);
        setShowHelp(false);
        return;
      case "show-help":
        setShowHelp(true);
        setResponseMessage(result.message);
        return;
      case "clear":
        setShowHelp(false);
        setShowMap(false);
        setResponseMessage(result.message);
        return;
      case "open-map":
        setShowMap(true);
        setResponseMessage(result.message);
        return;
      case "close-map":
        setShowMap(false);
        setResponseMessage(result.message);
        return;
      case "unknown":
        setResponseMessage(result.message);
        return;
    }
  }

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

        <div className="auron-command-stack">
          <CommandInput onSubmit={handleCommand} />

          <div className="auron-response" role="status" aria-live="polite">
            <span className="auron-response__label">AURON</span>
            <p>{responseMessage}</p>
          </div>

          {showHelp ? (
            <FloatingPanel title="COMMAND INDEX">
              <ul className="command-list">
                {helpCommands.map((command) => (
                  <li key={command}>{command}</li>
                ))}
              </ul>
            </FloatingPanel>
          ) : null}

          {showMap ? (
            <FloatingPanel title="MAP MODULE" tone="accent">
              <p>Map system reserved for next stage.</p>
            </FloatingPanel>
          ) : null}
        </div>

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
                onClick={() => handleStateChange(nextState)}
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
