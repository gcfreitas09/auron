import CommandInput from "./CommandInput";
import FloatingPanel from "./FloatingPanel";
import GlobePanel from "./GlobePanel";
import ModeToggle from "./ModeToggle";
import Orb from "./Orb";
import SystemHeader from "./SystemHeader";
import VoiceControl from "./VoiceControl";
import type { MapLocation, MapRuntimeCommand } from "../core/mapLocations";
import { auronStates, type AuronState } from "../types/auron";

type DevModeProps = {
  state: AuronState;
  selectedState: AuronState;
  responseMessage: string;
  showHelp: boolean;
  showMap: boolean;
  mapLocation: MapLocation;
  mapCommand: MapRuntimeCommand | null;
  helpCommands: string[];
  onCloseDev: () => void;
  onTextCommand: (command: string) => void;
  onGlobeStatusChange: (message: string) => void;
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
  mapLocation,
  mapCommand,
  helpCommands,
  onCloseDev,
  onTextCommand,
  onGlobeStatusChange,
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
    <section
      className={`atlas-mode atlas-mode--dev${showMap ? " atlas-mode--map-active" : ""}`}
      aria-label="ATLAS development interface"
    >
      {showMap ? (
        <div className="dev-globe-layout">
          <div className="dev-globe-stage">
            <GlobePanel
              isOpen={showMap}
              targetLocation={mapLocation}
              command={mapCommand}
              onClose={onMapClose}
              onStatusChange={onGlobeStatusChange}
              variant="dev"
            />
          </div>

          <div className="dev-overlay">
            <div className="dev-toolbar dev-toolbar--overlay">
              <ModeToggle label="Presentation" onClick={onCloseDev} />
            </div>

            <div className="dev-overlay__header">
              <span className="dev-overlay__eyebrow">ATLAS DEV</span>
              <strong>{state.toUpperCase()}</strong>
            </div>

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

            {showHelp ? (
              <FloatingPanel title="COMMAND INDEX" onClose={onHelpClose}>
                <ul className="command-list">
                  {helpCommands.map((command) => (
                    <li key={command}>{command}</li>
                  ))}
                </ul>
              </FloatingPanel>
            ) : null}

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

          <div className="dev-core-hud">
            <div className="atlas-core atlas-core--mini">
              <Orb state={state} />
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="dev-toolbar">
            <ModeToggle label="Presentation" onClick={onCloseDev} />
          </div>

          <SystemHeader />

          <div className="auron-main-layout auron-main-layout--dev">
            <div className="atlas-core atlas-core--center auron-orb-zone auron-orb-zone--dev">
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
        </>
      )}
    </section>
  );
}

export default DevMode;
