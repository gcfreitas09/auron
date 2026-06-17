import { useEffect } from "react";
import { CircleMarker, MapContainer, TileLayer, Tooltip, useMap } from "react-leaflet";
import type { MapViewport } from "../core/mapLocations";

type MapPanelProps = {
  viewport: MapViewport;
};

function SyncMapView({ viewport }: MapPanelProps) {
  const map = useMap();

  useEffect(() => {
    map.setView([viewport.latitude, viewport.longitude], viewport.zoom, {
      animate: true,
      duration: 0.8
    });
  }, [map, viewport]);

  return null;
}

function MapPanel({ viewport }: MapPanelProps) {
  return (
    <div className="map-panel">
      <div className="map-panel__meta">
        <div>
          <span className="map-panel__eyebrow">Live Navigation</span>
          <strong>{viewport.label}</strong>
        </div>
        <p>
          Lat {viewport.latitude.toFixed(4)} | Lng {viewport.longitude.toFixed(4)} | Zoom{" "}
          {viewport.zoom}
        </p>
      </div>

      <div className="map-panel__canvas">
        <MapContainer
          center={[viewport.latitude, viewport.longitude]}
          zoom={viewport.zoom}
          scrollWheelZoom
          className="map-panel__leaflet"
        >
          <SyncMapView viewport={viewport} />
          {/*
            OpenStreetMap tiles are fine for development and light usage.
            Public high-traffic apps should respect OSM tile usage policy or use a proper tile provider/server.
          */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <CircleMarker
            center={[viewport.latitude, viewport.longitude]}
            radius={10}
            pathOptions={{
              color: "#7ee7ff",
              weight: 2,
              fillColor: "#37b8ff",
              fillOpacity: 0.45
            }}
          >
            <Tooltip direction="top" offset={[0, -10]} opacity={1} permanent>
              {viewport.label}
            </Tooltip>
          </CircleMarker>
        </MapContainer>
      </div>
    </div>
  );
}

export default MapPanel;
