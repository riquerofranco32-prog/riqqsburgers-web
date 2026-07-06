# Costo de envío por tenant

Tres modos, configurables en `/[slug]/admin` → Configuración → sección "Envío":

- **none**: solo retiro en local (default para tenants nuevos).
- **zones**: zonas con nombre y precio fijo (dropdown en el checkout).
- **distance**: precio por rango de km en línea recta desde el local
  (Haversine × 1.3 de corrección urbana), con dirección buscada por
  geocoding y pin arrastrable en un mapa Leaflet.

## Activar delivery para un tenant

1. Configurar la ubicación del local (busca la dirección, aparece el mapa,
   arrastrá el pin si no cae exacto). Obligatorio antes de poder activar
   modo `distance`.
2. Elegir `zones` o `distance` en el selector.
3. `zones`: agregar zonas (nombre + precio) en la tabla de la misma sección.
4. `distance`: agregar rangos (`hasta X km → $Y`), sin duplicar `max_km`.

Los tenants que ya cobraban un `delivery_cost` fijo antes de este feature
fueron migrados automáticamente a `zones` con una única zona "Envío" que
preserva el mismo precio (ver `supabase/migrations/20260706_add_delivery_pricing.sql`).

## Por qué Photon → Nominatim en vez de Google

Ambos son gratis y no requieren tarjeta ni API key, a diferencia de Google
Places/Maps. Photon es el proveedor primario (rápido, buen soporte de
direcciones en Argentina); si no encuentra nada o falla, se hace fallback a
Nominatim (rate limit más estricto, por eso el `User-Agent` obligatorio en
la request). Ambos resultados se cachean en `geocode_cache` por tenant +
query normalizada para no repetir la consulta.

El geocoder solo aproxima — el pin arrastrable en el mapa es la fuente de
verdad real para el cadete. El link de WhatsApp usa las coordenadas del pin
(`google.com/maps?q=lat,lng`), no la dirección tipeada.

## Por qué Haversine × 1.3 en vez de una API de ruteo

Una API de Distance Matrix (Google, Mapbox) da la distancia de ruta real,
pero cuesta y requiere tarjeta. Haversine (línea recta) es gratis y el
factor 1.3 es una corrección estándar para aproximar una ruta urbana desde
la distancia recta. Es una aproximación, no exacta — aceptable para un
negocio que igual coordina el pedido por WhatsApp.

## Migrar a un proveedor pago si el volumen lo justifica

Todo el adapter de geocoding vive en `app/api/geocode/route.ts`
(`searchPhoton` / `searchNominatim`). Si algún tenant necesita más volumen o
mejor precisión, se reemplaza esa función por un adapter de LocationIQ o
Google Geocoding — el resto del sistema (`geocode_cache`, `lib/delivery.ts`,
el checkout, el admin) no se toca.
