import FloatingPanel from "./FloatingPanel";
import MapPanel from "./MapPanel";
import Orb from "./Orb";
import SystemHeader from "./SystemHeader";
import VoiceControl from "./VoiceControl";
import type { MapViewport } from "../core/mapLocations";
import ModeToggle from "./ModeToggle";
import type { AuronState } from "../types/auron";

type PresentationModeProps = {
  state: AuronState;
  responseMessage: string;
  showMap: boolean;
  mapViewport: MapViewport;
  onOpenDev: () => void;
  onMapClose: () => void;
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
  mapViewport,
  onOpenDev,
  onMapClose,
  onListeningStart,
  onListeningEnd,
  onRecognized,
  onError,
  onUnsupported
}: PresentationModeProps) {
  return (
    <section className="atlas-mode atlas-mode--presentation" aria-label="ATLAS interface">
      <ModeToggle label="DEV" onClick={onOpenDev} className="mode-toggle--presentation" />

      <SystemHeader />

      <div className="presentation-layout">
        <div className="auron-orb-zone">
          <Orb state={state} />
        </div>

        <div className="presentation-status" role="status" aria-live="polite">
          <span className="presentation-status__label">System Status</span>
          <strong>{state.toUpperCase()}</strong>
        </div>

        <div className="presentation-response" role="status" aria-live="polite">
          <p>{responseMessage}</p>
        </div>

        {showMap ? (
          <FloatingPanel
            title="MAP MODULE"
            variant="accent"
            onClose={onMapClose}
            className="presentation-map-panel"
          >
            <MapPanel viewport={mapViewport} />
          </FloatingPanel>
        ) : null}

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
    </section>
  );
}

export default PresentationMode;
