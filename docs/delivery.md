# Costo de envío por tenant

Cuatro modos, configurables en `/[slug]/admin` → Configuración → sección "Envío":

- **none** (🚶 Solo retiro): sin delivery, el cliente solo retira en el local.
- **fixed** (📦 Costo fijo): un único precio de envío para todos los pedidos,
  sin importar dónde viva el cliente. Reutiliza la columna `delivery_cost`
  que ya existía antes de este feature — no hace falta ubicación ni mapa.
- **zones** (📍 Zonas): precio distinto según barrio/zona (dropdown en el checkout).
- **distance** (🗺️ Por distancia): precio por rango de km en línea recta
  desde el local (Haversine × 1.3 de corrección urbana), con dirección
  buscada por geocoding y pin arrastrable en un mapa Leaflet.

## Cómo elegir el modo (guía rápida)

| Situación del negocio | Modo recomendado |
| --- | --- |
| No hago envíos, solo venden en el local | `none` |
| Siempre entrego en la misma zona / no quiero complicarme | `fixed` |
| Cobro distinto según barrio, pero conozco bien mi zona de reparto | `zones` |
| Quiero que el sistema calcule según qué tan lejos vive el cliente | `distance` |

## Ejemplos de configuración por sección

**Costo fijo** — un solo campo:

```
Costo de envío fijo: $800
```
El cliente ve "Envío: $800" en el checkout sin importar la dirección. Poné
`0` si el envío es gratis pero igual querés pedir la dirección.

**Zonas** — nombre + precio, tantas filas como zonas manejes:

```
Centro         → $500
Barrio Sur     → $800
Zona Norte     → $1.200
```
El cliente elige su zona de un dropdown al momento de pedir.

**Distancia** — hasta X km → $Y, ordenado de menor a mayor y sin superponer:

```
0 a 3 km   → $500
3 a 6 km   → $900
6 a 10 km  → $1.500
```
Además hace falta:
- **Ubicación del local**: buscá la dirección y ajustá el pin — es el punto
  desde el que se mide la distancia a cada cliente.
- **Pista de ciudad**: ej. `"San Rafael, Mendoza"`, ayuda al buscador a no
  confundir direcciones de otras ciudades con el mismo nombre de calle.
- **Mensaje fuera de rango**: lo que ve el cliente si su dirección cae más
  lejos que tu último rango, ej. `"Consultanos por WhatsApp, puede que
  igual te lo llevemos"`.

## Activar delivery para un tenant

1. Elegir el modo en el selector (ver tabla de arriba).
2. `fixed`: completar el costo de envío único.
3. `zones`: agregar zonas (nombre + precio) en la tabla de la misma sección.
4. `distance`: configurar la ubicación del local primero (obligatorio antes
   de poder activar este modo), después agregar rangos (`hasta X km → $Y`,
   sin duplicar `max_km`).

Los tenants que ya cobraban un `delivery_cost` fijo antes de este feature
fueron migrados automáticamente a `zones` con una única zona "Envío" que
preserva el mismo precio (ver `supabase/migrations/20260706_add_delivery_pricing.sql`).
Si preferían el comportamiento original de "un solo precio para todos", 
alcanza con cambiar el modo a `fixed` en el admin — el valor de
`delivery_cost` ya está cargado con el número correcto.

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
