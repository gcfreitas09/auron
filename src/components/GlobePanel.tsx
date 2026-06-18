import { useEffect, useMemo, useRef, useState } from "react";
import {
  Cartesian2,
  Cartesian3,
  Cartographic,
  Color,
  Credit,
  HeadingPitchRoll,
  Math as CesiumMath,
  OpenStreetMapImageryProvider,
  UrlTemplateImageryProvider,
  Viewer
} from "cesium";
import MapPanel from "./MapPanel";
import { defaultMapLocation, toMapViewport, type MapLocation, type MapRuntimeCommand } from "../core/mapLocations";

type GlobePanelProps = {
  isOpen: boolean;
  targetLocation: MapLocation;
  command: MapRuntimeCommand | null;
  onClose?: () => void;
  onStatusChange?: (message: string) => void;
  variant?: "presentation" | "dev";
};

type CameraTarget = {
  latitude: number;
  longitude: number;
  height: number;
  heading: number;
  pitch: number;
  roll: number;
};

type ZoomDirection = "in" | "out";

const MIN_CAMERA_HEIGHT = 30000;
const MAX_CAMERA_HEIGHT = 25000000;
const RECOVERY_HEIGHT = 18000000;
const RECOVERY_LATITUDE = -15;
const RECOVERY_LONGITUDE = -45;
const WHEEL_THROTTLE_MS = 140;
const ZOOM_IN_FACTOR = 1.45;
const ZOOM_OUT_FACTOR = 1.55;

function clampHeight(height: number) {
  if (!Number.isFinite(height)) {
    return RECOVERY_HEIGHT;
  }

  return CesiumMath.clamp(height, MIN_CAMERA_HEIGHT, MAX_CAMERA_HEIGHT);
}

function getSafePitchForHeight(height: number) {
  if (height < 120000) {
    return -55;
  }

  if (height < 800000) {
    return -65;
  }

  if (height < 3000000) {
    return -75;
  }

  return -90;
}

function getSafeDuration(height: number) {
  if (height < 120000) {
    return 0.35;
  }

  if (height < 800000) {
    return 0.45;
  }

  return 0.7;
}

function toDestination(target: CameraTarget) {
  return Cartesian3.fromDegrees(target.longitude, target.latitude, target.height);
}

function toOrientation(target: CameraTarget) {
  return new HeadingPitchRoll(
    CesiumMath.toRadians(target.heading),
    CesiumMath.toRadians(target.pitch),
    CesiumMath.toRadians(target.roll)
  );
}

function toLocationCameraTarget(location: MapLocation): CameraTarget {
  return {
    latitude: location.latitude,
    longitude: location.longitude,
    height: clampHeight(location.camera.height),
    heading: location.camera.heading,
    pitch: location.camera.pitch,
    roll: location.camera.roll
  };
}

function isViewerActive(viewer: Viewer | null) {
  return Boolean(viewer && !viewer.isDestroyed());
}

function getCurrentCameraHeight(viewer: Viewer) {
  return clampHeight(viewer.camera.positionCartographic.height);
}

function isCameraInvalid(height: number) {
  return !Number.isFinite(height) || height < 1000 || height > 50000000;
}

function GlobePanel({
  isOpen,
  targetLocation,
  command,
  onClose,
  onStatusChange,
  variant = "presentation"
}: GlobePanelProps) {
  const viewerRef = useRef<Viewer | null>(null);
  const mountRef = useRef<HTMLDivElement | null>(null);
  const creditsRef = useRef<HTMLDivElement | null>(null);
  const fallbackProviderActivatedRef = useRef(false);
  const reportedTextureFailureRef = useRef(false);
  const lastWheelAtRef = useRef(0);
  const [globeError, setGlobeError] = useState("");
  const [fallbackMessage, setFallbackMessage] = useState("");
  const fallbackViewport = useMemo(() => toMapViewport(targetLocation), [targetLocation]);

  function reportTextureFailure() {
    if (!reportedTextureFailureRef.current) {
      reportedTextureFailureRef.current = true;
      onStatusChange?.("Falha ao carregar textura do globo.");
    }
  }

  function createPrimaryImageryProvider() {
    return new OpenStreetMapImageryProvider({
      url: "https://tile.openstreetmap.org/",
      credit: new Credit("(C) OpenStreetMap contributors")
    });
  }

  function createFallbackImageryProvider() {
    return new UrlTemplateImageryProvider({
      url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      subdomains: ["a", "b", "c"],
      credit: new Credit("(C) OpenStreetMap contributors"),
      maximumLevel: 19
    });
  }

  function flyToCameraTarget(viewer: Viewer, target: CameraTarget, duration: number) {
    viewer.camera.cancelFlight();
    viewer.camera.flyTo({
      destination: toDestination(target),
      orientation: toOrientation(target),
      duration
    });
  }

  function flyToLocation(viewer: Viewer, location: MapLocation, duration = 2.1) {
    flyToCameraTarget(viewer, toLocationCameraTarget(location), duration);
  }

  function flyToGlobalView(viewer: Viewer, duration = 1.2) {
    flyToCameraTarget(
      viewer,
      {
        latitude: defaultMapLocation.latitude,
        longitude: defaultMapLocation.longitude,
        height: clampHeight(defaultMapLocation.camera.height),
        heading: 0,
        pitch: -90,
        roll: 0
      },
      duration
    );
  }

  function recoverGlobeViewIfLost(viewer: Viewer) {
    console.warn("recovery triggered");
    viewer.camera.cancelFlight();
    onStatusChange?.("Recentralizando globo.");
    flyToCameraTarget(
      viewer,
      {
        latitude: RECOVERY_LATITUDE,
        longitude: RECOVERY_LONGITUDE,
        height: RECOVERY_HEIGHT,
        heading: 0,
        pitch: -90,
        roll: 0
      },
      0.8
    );
    viewer.scene.requestRender();
  }

  function getCameraTarget(viewer: Viewer): CameraTarget | null {
    const canvas = viewer.scene.canvas;
    const center = new Cartesian2(canvas.clientWidth / 2, canvas.clientHeight / 2);
    const centerPoint = viewer.camera.pickEllipsoid(center, viewer.scene.globe.ellipsoid);
    const height = getCurrentCameraHeight(viewer);

    console.log("pickEllipsoid result", centerPoint ? "ok" : "null");
    console.log("current height", height);

    if (!centerPoint || isCameraInvalid(height)) {
      recoverGlobeViewIfLost(viewer);
      return null;
    }

    const cartographic = Cartographic.fromCartesian(centerPoint);

    if (!cartographic) {
      recoverGlobeViewIfLost(viewer);
      return null;
    }

    return {
      latitude: CesiumMath.toDegrees(cartographic.latitude),
      longitude: CesiumMath.toDegrees(cartographic.longitude),
      height,
      heading: CesiumMath.toDegrees(viewer.camera.heading),
      pitch: CesiumMath.toDegrees(viewer.camera.pitch),
      roll: 0
    };
  }

  function safeZoom(viewer: Viewer, direction: ZoomDirection) {
    const current = getCameraTarget(viewer);

    if (!current) {
      return;
    }

    const rawNextHeight =
      direction === "out"
        ? current.height * ZOOM_OUT_FACTOR
        : current.height / ZOOM_IN_FACTOR;
    const nextHeight = clampHeight(rawNextHeight);

    console.log("next height", nextHeight);

    flyToCameraTarget(
      viewer,
      {
        latitude: current.latitude,
        longitude: current.longitude,
        height: nextHeight,
        heading: current.heading,
        pitch: getSafePitchForHeight(nextHeight),
        roll: 0
      },
      getSafeDuration(nextHeight)
    );
  }

  useEffect(() => {
    if (!isOpen || !mountRef.current || viewerRef.current) {
      return;
    }

    try {
      window.CESIUM_BASE_URL = CESIUM_BASE_URL;
      fallbackProviderActivatedRef.current = false;
      reportedTextureFailureRef.current = false;
      lastWheelAtRef.current = 0;
      setFallbackMessage("");
      setGlobeError("");

      const viewer = new Viewer(mountRef.current, {
        animation: false,
        timeline: false,
        geocoder: false,
        homeButton: false,
        sceneModePicker: false,
        baseLayerPicker: false,
        navigationHelpButton: false,
        fullscreenButton: false,
        infoBox: false,
        selectionIndicator: false,
        scene3DOnly: true,
        requestRenderMode: true,
        baseLayer: false,
        creditContainer: creditsRef.current ?? undefined
      });

      viewerRef.current = viewer;
      viewer.scene.globe.show = true;
      viewer.scene.backgroundColor = Color.BLACK;
      viewer.scene.globe.baseColor = Color.BLACK;
      viewer.scene.skyAtmosphere.show = true;
      viewer.scene.sun.show = false;
      viewer.scene.moon.show = false;
      viewer.scene.globe.enableLighting = false;
      viewer.scene.globe.depthTestAgainstTerrain = false;
      viewer.scene.postProcessStages.fxaa.enabled = true;

      const controller = viewer.scene.screenSpaceCameraController;
      controller.enableCollisionDetection = true;
      controller.minimumZoomDistance = MIN_CAMERA_HEIGHT;
      controller.maximumZoomDistance = MAX_CAMERA_HEIGHT;
      controller.inertiaZoom = 0;
      controller.inertiaSpin = 0.15;
      controller.inertiaTranslate = 0.15;
      controller.maximumMovementRatio = 0.04;
      controller.enableZoom = false;
      controller.enableRotate = true;
      controller.enableTilt = true;

      const applyImageryProvider = (
        provider: OpenStreetMapImageryProvider | UrlTemplateImageryProvider,
        providerLabel: string
      ) => {
        provider.errorEvent.addEventListener((error) => {
          console.error(`Cesium imagery provider error: ${providerLabel}`, error);

          if (!fallbackProviderActivatedRef.current && providerLabel === "OpenStreetMap primary") {
            fallbackProviderActivatedRef.current = true;
            console.warn("Primary OSM provider failed. Switching to fallback imagery provider.");
            applyImageryProvider(createFallbackImageryProvider(), "OpenStreetMap fallback");
            return;
          }

          const message = "Globo 3D indisponivel neste ambiente. Falha ao carregar textura do globo.";
          setFallbackMessage(message);
          reportTextureFailure();
        });

        viewer.imageryLayers.removeAll();
        viewer.imageryLayers.addImageryProvider(provider);
        console.log("Cesium imagery provider configured", providerLabel);
        console.log("Imagery layer added", providerLabel);
        viewer.scene.requestRender();
      };

      const handleSafeWheelZoom = (event: WheelEvent) => {
        event.preventDefault();
        event.stopPropagation();

        const activeViewer = viewerRef.current;

        if (!isViewerActive(activeViewer)) {
          return;
        }

        const now = Date.now();

        if (now - lastWheelAtRef.current < WHEEL_THROTTLE_MS) {
          return;
        }

        lastWheelAtRef.current = now;
        console.log("wheel delta", event.deltaY);

        safeZoom(activeViewer, event.deltaY > 0 ? "out" : "in");
        activeViewer.scene.requestRender();
      };

      mountRef.current.addEventListener("wheel", handleSafeWheelZoom, {
        passive: false
      });

      applyImageryProvider(createPrimaryImageryProvider(), "OpenStreetMap primary");
      flyToLocation(viewer, targetLocation, 0);
      viewer.scene.requestRender();

      return () => {
        mountRef.current?.removeEventListener("wheel", handleSafeWheelZoom);
        if (viewerRef.current) {
          viewerRef.current.camera.cancelFlight();
          viewerRef.current.destroy();
          viewerRef.current = null;
        }
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Falha ao inicializar o globo 3D.";
      console.error("Cesium initialization error", error);
      reportTextureFailure();
      setGlobeError(`Globo 3D indisponivel neste ambiente. ${message}`);
    }

    return undefined;
  }, [isOpen, onStatusChange, targetLocation]);

  useEffect(() => {
    const viewer = viewerRef.current;

    if (!isViewerActive(viewer) || !command || globeError) {
      return;
    }

    try {
      switch (command.type) {
        case "fly-to":
          if (
            command.location.key === "globo" ||
            command.location.key === defaultMapLocation.key
          ) {
            flyToGlobalView(viewer);
          } else {
            flyToLocation(viewer, command.location);
          }
          break;
        case "zoom":
          safeZoom(viewer, command.delta > 0 ? "in" : "out");
          break;
        case "rotate": {
          const current = getCameraTarget(viewer);

          if (current) {
            flyToCameraTarget(
              viewer,
              {
                ...current,
                heading: current.heading + command.delta,
                roll: 0
              },
              0.7
            );
          }
          break;
        }
        case "tilt": {
          const current = getCameraTarget(viewer);

          if (current) {
            const nextPitch = CesiumMath.clamp(current.pitch - command.delta, -90, -35);

            flyToCameraTarget(
              viewer,
              {
                ...current,
                pitch: nextPitch,
                roll: 0
              },
              0.7
            );
          }
          break;
        }
      }

      viewer.scene.requestRender();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Falha ao atualizar a camera do globo.";
      console.error("Cesium camera update error", error);
      setGlobeError(`Globo 3D indisponivel neste ambiente. ${message}`);
    }
  }, [command, globeError]);

  const notice = globeError || fallbackMessage;
  const showFallback = Boolean(notice);

  return (
    <section
      className={`globe-panel globe-panel--${variant}${showFallback ? " globe-panel--fallback" : ""}`}
      aria-label="ATLAS Globe Mode"
    >
      {onClose ? (
        <button
          type="button"
          className="globe-panel__close"
          onClick={onClose}
          aria-label="Fechar mapa"
        >
          &times;
        </button>
      ) : null}

      <div className="globe-panel__meta">
        <div>
          <span className="globe-panel__eyebrow">Globe Mode</span>
          <strong>{targetLocation.label}</strong>
        </div>
        <p>ATLAS 3D navigation surface</p>
      </div>

      {notice ? <div className="globe-panel__notice">{notice}</div> : null}

      <div className="globe-panel__viewport">
        {!showFallback ? <div ref={mountRef} className="globe-panel__viewer" /> : null}
        {showFallback ? (
          <div className="globe-panel__fallback">
            <MapPanel viewport={fallbackViewport} />
          </div>
        ) : null}
      </div>

      <div className="globe-panel__credits" ref={creditsRef} />

      {/* OpenStreetMap public tiles are intended for development/light use. For production/high traffic, use a compliant tile provider or self-hosted tiles. */}
    </section>
  );
}

export default GlobePanel;
