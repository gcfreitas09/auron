import GlobePanel from "./GlobePanel";
import Orb from "./Orb";
import SystemHeader from "./SystemHeader";
import VoiceControl from "./VoiceControl";
import type { MapLocation, MapRuntimeCommand } from "../core/mapLocations";
import ModeToggle from "./ModeToggle";
import type { AuronState } from "../types/auron";

type PresentationModeProps = {
  state: AuronState;
  responseMessage: string;
  showMap: boolean;
  mapLocation: MapLocation;
  mapCommand: MapRuntimeCommand | null;
  onOpenDev: () => void;
  onMapClose: () => void;
  onGlobeStatusChange: (message: string) => void;
  onListeningStart: () => void;
  onListeningEnd: () => void;
  onRecognized: (command: string, transcript: string) => void | Promise<void>;
  onError: (message: string) => void;
  onUnsupported: (message: string) => void;
};

function PresentationMode({
  state,
  responseMessage,
  showMap,
  mapLocation,
  mapCommand,
  onOpenDev,
  onMapClose,
  onGlobeStatusChange,
  onListeningStart,
  onListeningEnd,
  onRecognized,
  onError,
  onUnsupported
}: PresentationModeProps) {
  return (
    <section
      className={`atlas-mode atlas-mode--presentation${showMap ? " atlas-mode--map-active" : ""}`}
      aria-label="ATLAS interface"
    >
      <ModeToggle label="DEV" onClick={onOpenDev} className="mode-toggle--presentation" />

      {showMap ? (
        <div className="presentation-globe-layout">
          <div className="presentation-globe-stage">
            <GlobePanel
              isOpen={showMap}
              targetLocation={mapLocation}
              command={mapCommand}
              onClose={onMapClose}
              onStatusChange={onGlobeStatusChange}
            />
          </div>

          <div className="presentation-hud">
            <div className="atlas-core atlas-core--mini presentation-hud__core">
              <Orb state={state} />
            </div>

            <div className="presentation-hud__brand">
              <span>ATLAS</span>
              <strong>{state.toUpperCase()}</strong>
            </div>

            <div className="presentation-hud__response" role="status" aria-live="polite">
              <p>{responseMessage}</p>
            </div>

            <VoiceControl
              onListeningStart={onListeningStart}
              onListeningEnd={onListeningEnd}
              onRecognized={onRecognized}
              onError={onError}
              onUnsupported={onUnsupported}
              showMeta={false}
              compact
            />
          </div>
        </div>
      ) : (
        <>
          <SystemHeader />

          <div className="presentation-layout">
            <div className="atlas-core atlas-core--center auron-orb-zone">
              <Orb state={state} />
            </div>

            <div className="presentation-status" role="status" aria-live="polite">
              <span className="presentation-status__label">System Status</span>
              <strong>{state.toUpperCase()}</strong>
            </div>

            <div className="presentation-response" role="status" aria-live="polite">
              <p>{responseMessage}</p>
            </div>

            <VoiceControl
              onListeningStart={onListeningStart}
              onListeningEnd={onListeningEnd}
              onRecognized={onRecognized}
              onError={onError}
              onUnsupported={onUnsupported}
              showMeta={false}
              compact
            />
          </div>
        </>
      )}
    </section>
  );
}

export default PresentationMode;
