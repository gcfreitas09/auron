import { useEffect, useRef, useState } from "react";
import CommandInput from "./components/CommandInput";
import FloatingPanel from "./components/FloatingPanel";
import Orb from "./components/Orb";
import SystemHeader from "./components/SystemHeader";
import VoiceControl from "./components/VoiceControl";
import { routeCommand } from "./core/commandRouter";
import { auronStates, type AuronState } from "./types/auron";

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
  const [transientState, setTransientState] = useState<AuronState | null>(null);
  const [responseMessage, setResponseMessage] = useState(
    "Aguardando comando local."
  );
  const [showHelp, setShowHelp] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const transientTimerRef = useRef<number | null>(null);
  const transientStateRef = useRef<AuronState | null>(null);

  const activeOrbState = transientState ?? state;

  useEffect(() => {
    transientStateRef.current = transientState;
  }, [transientState]);

  function clearTransientTimer() {
    if (transientTimerRef.current !== null) {
      window.clearTimeout(transientTimerRef.current);
      transientTimerRef.current = null;
    }
  }

  function setTransientFor(stateValue: AuronState, durationMs: number) {
    clearTransientTimer();
    setTransientState(stateValue);
    transientTimerRef.current = window.setTimeout(() => {
      setTransientState(null);
      transientTimerRef.current = null;
    }, durationMs);
  }

  function stopTransientState() {
    clearTransientTimer();
    setTransientState(null);
  }

  async function speakMessage(message: string) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      stopTransientState();
      return;
    }

    window.speechSynthesis.cancel();
    setTransientState("speaking");

    await new Promise<void>((resolve) => {
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.lang = "pt-BR";
      utterance.onend = () => {
        stopTransientState();
        resolve();
      };
      utterance.onerror = () => {
        stopTransientState();
        resolve();
      };
      window.speechSynthesis.speak(utterance);
    });
  }

  async function executeCommand(command: string, source: "text" | "voice") {
    const result = routeCommand(command);

    switch (result.type) {
      case "set-state":
        setState(result.state);
        setResponseMessage(result.message);
        setShowHelp(false);
        break;
      case "show_help":
        setShowHelp(true);
        setResponseMessage(result.message);
        break;
      case "clear":
        setShowHelp(false);
        setShowMap(false);
        setResponseMessage(result.message);
        break;
      case "open-map":
        setShowMap(true);
        setResponseMessage(result.message);
        break;
      case "close-map":
        setShowMap(false);
        setResponseMessage(result.message);
        break;
      case "unknown":
        setResponseMessage(result.message);
        break;
    }

    if (source === "voice") {
      await speakMessage(result.message);
    }
  }

  function handleStateChange(nextState: AuronState) {
    setState(nextState);
    setResponseMessage(`Estado alterado para ${nextState.toUpperCase()}.`);
  }

  function handleTextCommand(command: string) {
    void executeCommand(command, "text");
  }

  async function handleVoiceRecognized(command: string, transcript: string) {
    setResponseMessage(`Comando de voz reconhecido: ${transcript}`);
    setTransientState("thinking");
    await new Promise((resolve) => window.setTimeout(resolve, 300));
    await executeCommand(command, "voice");
  }

  function handleVoiceError(message: string) {
    setResponseMessage(message);
    setTransientFor("error", 1800);
  }

  function handleVoiceUnsupported(message: string) {
    setResponseMessage(message);
  }

  function handleVoiceListeningStart() {
    clearTransientTimer();
    setTransientState("listening");
    setResponseMessage("Ouvindo...");
  }

  function handleVoiceListeningEnd() {
    if (transientStateRef.current === "listening") {
      stopTransientState();
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

      <section className="auron-stage" aria-label="ATLAS interface">
        <SystemHeader />

        <div className="auron-main-layout">
          <div className="auron-orb-zone">
            <Orb state={activeOrbState} />
          </div>

          <div className="auron-control-deck">
            <CommandInput onSubmit={handleTextCommand} />
            <VoiceControl
              onListeningStart={handleVoiceListeningStart}
              onListeningEnd={handleVoiceListeningEnd}
              onRecognized={handleVoiceRecognized}
              onError={handleVoiceError}
              onUnsupported={handleVoiceUnsupported}
            />

            <FloatingPanel
              title="ATLAS RESPONSE"
              variant="subtle"
              className="auron-response-panel"
            >
              <div className="auron-response" role="status" aria-live="polite">
                <p>{responseMessage}</p>
              </div>
            </FloatingPanel>

            <div className="auron-panel-stack">
              {showHelp ? (
                <FloatingPanel
                  title="COMMAND INDEX"
                  onClose={() => setShowHelp(false)}
                >
                  <ul className="command-list">
                    {helpCommands.map((command) => (
                      <li key={command}>{command}</li>
                    ))}
                  </ul>
                </FloatingPanel>
              ) : null}

              {showMap ? (
                <FloatingPanel
                  title="MAP MODULE"
                  variant="accent"
                  onClose={() => setShowMap(false)}
                >
                  <p>Map system reserved for next stage.</p>
                </FloatingPanel>
              ) : null}
            </div>

            <div className="auron-status-panel">
              <div className="auron-status-line">
                <span className="auron-status-line__label">Status</span>
                <strong>{state.toUpperCase()}</strong>
              </div>

              <div className="auron-state-switcher" aria-label="ATLAS state controls">
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
          </div>
        </div>
      </section>
    </main>
  );
}

export default App;
