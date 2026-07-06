"use client";

import { useMemo } from "react";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const pinIcon = L.icon({
  iconUrl: "/leaflet/marker-icon.png",
  iconRetinaUrl: "/leaflet/marker-icon-2x.png",
  shadowUrl: "/leaflet/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function DraggableMarker({
  position,
  onMove,
}: {
  position: [number, number];
  onMove: (lat: number, lng: number) => void;
}) {
  return (
    <Marker
      position={position}
      icon={pinIcon}
      draggable
      eventHandlers={{
        dragend: (e) => {
          const marker = e.target as L.Marker;
          const { lat, lng } = marker.getLatLng();
          onMove(lat, lng);
        },
      }}
    />
  );
}

export default function DeliveryMap({
  lat,
  lng,
  onMove,
  height = 220,
  centerKey,
}: {
  lat: number;
  lng: number;
  onMove: (lat: number, lng: number) => void;
  height?: number;
  // Cambiar este valor (ej. al elegir una nueva sugerencia de dirección)
  // fuerza al mapa a recentrarse — react-leaflet solo usa `center` en el
  // mount inicial, no en updates posteriores.
  centerKey?: string | number;
}) {
  const position = useMemo<[number, number]>(() => [lat, lng], [lat, lng]);

  return (
    <div
      style={{
        height,
        borderRadius: 14,
        overflow: "hidden",
        border: "1px solid var(--border)",
      }}
    >
      <MapContainer
        key={centerKey ?? "static"}
        center={position}
        zoom={16}
        style={{ width: "100%", height: "100%" }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <DraggableMarker position={position} onMove={onMove} />
      </MapContainer>
    </div>
  );
}
