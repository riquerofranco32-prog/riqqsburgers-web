// Corrección urbana: línea recta (Haversine) subestima la ruta real que
// maneja un cadete. 1.3x es una aproximación estándar sin usar una API de
// ruteo paga (Distance Matrix). Ver docs/delivery.md.
const URBAN_CORRECTION_FACTOR = 1.3;

export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export interface DeliveryQuoteResult {
  price: number;
  distanceKm?: number;
  zoneName?: string;
  outOfRange?: boolean;
  message?: string;
}

interface ZoneRow {
  id: string;
  name: string;
  price: number;
}

interface RangeRow {
  max_km: number;
  price: number;
}

export function resolveZonePrice(
  zones: ZoneRow[],
  zoneId: string,
): DeliveryQuoteResult | null {
  const zone = zones.find((z) => z.id === zoneId);
  if (!zone) return null;
  return { price: zone.price, zoneName: zone.name };
}

export function resolveDistancePrice(
  ranges: RangeRow[],
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number,
  outOfRangeMessage: string,
): DeliveryQuoteResult {
  const straightLineKm = haversineKm(originLat, originLng, destLat, destLng);
  const distanceKm =
    Math.round(straightLineKm * URBAN_CORRECTION_FACTOR * 10) / 10;

  const sorted = [...ranges].sort((a, b) => a.max_km - b.max_km);
  const match = sorted.find((r) => r.max_km >= distanceKm);

  if (!match) {
    return {
      price: 0,
      distanceKm,
      outOfRange: true,
      message: outOfRangeMessage,
    };
  }
  return { price: match.price, distanceKm };
}
