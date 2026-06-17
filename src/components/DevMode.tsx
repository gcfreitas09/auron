import CommandInput from "./CommandInput";
import FloatingPanel from "./FloatingPanel";
import MapPanel from "./MapPanel";
import ModeToggle from "./ModeToggle";
import Orb from "./Orb";
import SystemHeader from "./SystemHeader";
import VoiceControl from "./VoiceControl";
import type { MapViewport } from "../core/mapLocations";
import { auronStates, type AuronState } from "../types/auron";

type DevModeProps = {
  state: AuronState;
  selectedState: AuronState;
  responseMessage: string;
  showHelp: boolean;
  showMap: boolean;
  mapViewport: MapViewport;
  helpCommands: string[];
  onCloseDev: () => void;
  onTextCommand: (command: string) => void;
  onListeningStart: () => void;
  onListeningEnd: () => void;
  onRecognized: (command: string, transcript: string) => void | Promise<void>;
  onError: (message: string) => void;
  onUnsupported: (message: string) => void;
  onHelpClose: () => void;
  onMapClose: () => void;
  onStateChange: (state: AuronState) => void;
};

function DevMode({
  state,
  selectedState,
  responseMessage,
  showHelp,
  showMap,
  mapViewport,
  helpCommands,
  onCloseDev,
  onTextCommand,
  onListeningStart,
  onListeningEnd,
  onRecognized,
  onError,
  onUnsupported,
  onHelpClose,
  onMapClose,
  onStateChange
}: DevModeProps) {
  return (
    <section className="atlas-mode atlas-mode--dev" aria-label="ATLAS development interface">
      <div className="dev-toolbar">
        <ModeToggle label="Presentation" onClick={onCloseDev} />
      </div>

      <SystemHeader />

      <div className="auron-main-layout auron-main-layout--dev">
        <div className="auron-orb-zone auron-orb-zone--dev">
          <Orb state={state} />
        </div>

        <div className="auron-control-deck">
          <CommandInput onSubmit={onTextCommand} />
          <VoiceControl
            onListeningStart={onListeningStart}
            onListeningEnd={onListeningEnd}
            onRecognized={onRecognized}
            onError={onError}
            onUnsupported={onUnsupported}
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
              <FloatingPanel title="COMMAND INDEX" onClose={onHelpClose}>
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
                onClose={onMapClose}
              >
                <MapPanel viewport={mapViewport} />
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
                  className={nextState === selectedState ? "is-active" : ""}
                  onClick={() => onStateChange(nextState)}
                >
                  {nextState}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default DevMode;
