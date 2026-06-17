import { useEffect, useRef, useState } from "react";
import DevMode from "./components/DevMode";
import PresentationMode from "./components/PresentationMode";
import { routeCommand } from "./core/commandRouter";
import { defaultMapLocation, toMapViewport, type MapViewport } from "./core/mapLocations";
import type { AuronState } from "./types/auron";

const helpCommands = [
  "estado idle",
  "estado ouvindo",
  "estado pensando",
  "estado falando",
  "estado erro",
  "abrir mapa",
  "abrir mapa de porto alegre",
  "abrir brasil",
  "abrir mapa do brasil",
  "abrir mapa de sao paulo",
  "abrir mapa do rio de janeiro",
  "abrir mapa de nova york",
  "abrir mapa de toquio",
  "abrir mapa de londres",
  "abrir mapa de paris",
  "aproximar mapa",
  "afastar mapa",
  "centralizar mapa",
  "fechar mapa",
  "ajuda",
  "limpar"
];

function App() {
  const [mode, setMode] = useState<"presentation" | "dev">("presentation");
  const [state, setState] = useState<AuronState>("idle");
  const [transientState, setTransientState] = useState<AuronState | null>(null);
  const [responseMessage, setResponseMessage] = useState(
    "Aguardando comando local."
  );
  const [showHelp, setShowHelp] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [mapViewport, setMapViewport] = useState<MapViewport>(() =>
    toMapViewport(defaultMapLocation)
  );
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
        setMapViewport(result.location);
        setResponseMessage(result.message);
        break;
      case "close-map":
        setShowMap(false);
        setResponseMessage(result.message);
        break;
      case "zoom-map":
        setShowMap(true);
        setMapViewport((currentViewport) => ({
          ...currentViewport,
          zoom: Math.max(2, Math.min(18, currentViewport.zoom + result.delta))
        }));
        setResponseMessage(result.message);
        break;
      case "center-map":
        setShowMap(true);
        setMapViewport(result.location);
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

      {mode === "presentation" ? (
        <PresentationMode
          state={activeOrbState}
          responseMessage={responseMessage}
          showMap={showMap}
          mapViewport={mapViewport}
          onOpenDev={() => setMode("dev")}
          onMapClose={() => setShowMap(false)}
          onListeningStart={handleVoiceListeningStart}
          onListeningEnd={handleVoiceListeningEnd}
          onRecognized={handleVoiceRecognized}
          onError={handleVoiceError}
          onUnsupported={handleVoiceUnsupported}
        />
      ) : (
        <DevMode
          state={activeOrbState}
          selectedState={state}
          responseMessage={responseMessage}
          showHelp={showHelp}
          showMap={showMap}
          mapViewport={mapViewport}
          helpCommands={helpCommands}
          onCloseDev={() => setMode("presentation")}
          onTextCommand={handleTextCommand}
          onListeningStart={handleVoiceListeningStart}
          onListeningEnd={handleVoiceListeningEnd}
          onRecognized={handleVoiceRecognized}
          onError={handleVoiceError}
          onUnsupported={handleVoiceUnsupported}
          onHelpClose={() => setShowHelp(false)}
          onMapClose={() => setShowMap(false)}
          onStateChange={handleStateChange}
        />
      )}
    </main>
  );
}

export default App;
