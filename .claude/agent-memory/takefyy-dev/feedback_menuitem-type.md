---
name: menuitem-type
description: MenuItem interface no incluye campo 'available' — la disponibilidad se maneja solo via badge "Agotado"
metadata:
  type: feedback
---

El tipo `MenuItem` en `lib/getRestaurant.ts` NO tiene propiedad `available`. La disponibilidad de un producto en el catálogo público se determina únicamente por `item.badge === "Agotado"`. El campo `available` existe en la tabla Supabase y se filtra en `getRestaurant.ts` (solo items con `available: true` llegan al cliente), por eso nunca llega al tipo.

**Why:** TypeScript error al intentar usar `selectedItem.available === false` en CatalogClient.tsx.

**How to apply:** Cuando se necesite detectar si un producto está agotado en el cliente, usar `item.badge === "Agotado"` como única fuente de verdad.
