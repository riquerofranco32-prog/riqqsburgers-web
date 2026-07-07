"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Loader2, MapPin } from "lucide-react";

const DeliveryMap = dynamic(() => import("./DeliveryMap"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        height: 220,
        borderRadius: 14,
        background: "var(--surface-2)",
        border: "1px solid var(--border)",
      }}
    />
  ),
});

interface GeocodeResult {
  label: string;
  lat: number;
  lng: number;
}

export interface DeliveryPosition {
  lat: number;
  lng: number;
  label: string;
}

export default function AddressGeocodePicker({
  slug,
  fallbackCenter,
  initialPosition = null,
  onChange,
  mapHeight = 220,
}: {
  slug: string;
  fallbackCenter: { lat: number; lng: number } | null;
  initialPosition?: DeliveryPosition | null;
  onChange: (pos: DeliveryPosition) => void;
  mapHeight?: number;
}) {
  const [query, setQuery] = useState(initialPosition?.label ?? "");
  const [suggestions, setSuggestions] = useState<GeocodeResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [position, setPosition] = useState<DeliveryPosition | null>(
    initialPosition,
  );
  const [mapRevision, setMapRevision] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Evita que setQuery(s.label) al elegir una sugerencia (o el label ya
  // confirmado con el que se monta el componente) dispare una nueva
  // búsqueda para ese mismo label — sin esto, el dropdown se reabre y tapa
  // el mapa apenas el usuario elige una dirección, o incluso al cargar una
  // dirección ya guardada.
  const skipNextSearchRef = useRef(initialPosition != null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (skipNextSearchRef.current) {
      skipNextSearchRef.current = false;
      return;
    }
    if (query.trim().length < 4) {
      setSuggestions([]);
      setSearched(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      setSearched(true);
      try {
        const res = await fetch(
          `/api/geocode?slug=${encodeURIComponent(slug)}&q=${encodeURIComponent(query)}`,
        );
        const data = (await res.json()) as { results?: GeocodeResult[] };
        setSuggestions(data.results ?? []);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 600);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, slug]);

  function pickSuggestion(s: GeocodeResult) {
    const pos = { lat: s.lat, lng: s.lng, label: s.label };
    setPosition(pos);
    skipNextSearchRef.current = true;
    setQuery(s.label);
    setSuggestions([]);
    setMapRevision((r) => r + 1);
    onChange(pos);
  }

  function markOnMapManually() {
    const center = position ?? fallbackCenter;
    if (!center) return;
    const pos = {
      lat: center.lat,
      lng: center.lng,
      label: query || "Ubicación marcada en el mapa",
    };
    setPosition(pos);
    setSuggestions([]);
    setMapRevision((r) => r + 1);
    onChange(pos);
  }

  function handleDrag(lat: number, lng: number) {
    setPosition((prev) => {
      const next = { lat, lng, label: prev?.label ?? query };
      onChange(next);
      return next;
    });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ position: "relative" }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Calle y número, barrio..."
          style={{
            width: "100%",
            background: "var(--surface-2)",
            border: "1px solid var(--border)",
            borderRadius: 10,
            padding: "11px 14px",
            color: "var(--text-primary)",
            fontSize: 15,
            outline: "none",
            boxSizing: "border-box",
          }}
        />
        {loading && (
          <Loader2
            size={16}
            className="animate-spin"
            style={{
              position: "absolute",
              right: 12,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--text-secondary)",
            }}
          />
        )}
        {suggestions.length > 0 && (
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 4px)",
              left: 0,
              right: 0,
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 10,
              overflow: "hidden",
              zIndex: 20,
              boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
            }}
          >
            {suggestions.map((s, i) => (
              <button
                key={i}
                type="button"
                onClick={() => pickSuggestion(s)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  width: "100%",
                  textAlign: "left",
                  padding: "10px 12px",
                  background: "transparent",
                  border: "none",
                  borderTop: i > 0 ? "1px solid var(--border)" : "none",
                  color: "var(--text-primary)",
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                <MapPin size={14} style={{ flexShrink: 0, opacity: 0.6 }} />
                {s.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {!loading && searched && suggestions.length === 0 && !position && (
        <div
          style={{
            fontSize: 12,
            color: "var(--text-secondary)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
          }}
        >
          <span>
            No encontramos esa dirección — probá con calle y número, o marcala
            directo en el mapa.
          </span>
          {fallbackCenter && (
            <button
              type="button"
              onClick={markOnMapManually}
              style={{
                flexShrink: 0,
                background: "none",
                border: "1px solid var(--border)",
                borderRadius: 8,
                padding: "6px 10px",
                color: "var(--accent)",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Marcar en el mapa
            </button>
          )}
        </div>
      )}

      {position && suggestions.length === 0 && (
        <>
          <DeliveryMap
            lat={position.lat}
            lng={position.lng}
            onMove={handleDrag}
            height={mapHeight}
            centerKey={mapRevision}
          />
          <p
            style={{ fontSize: 12, color: "var(--text-secondary)", margin: 0 }}
          >
            Arrastrá el pin hasta tu puerta — así el cadete llega exacto.
          </p>
        </>
      )}
    </div>
  );
}
