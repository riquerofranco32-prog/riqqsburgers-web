# Session: 2026-06-27

**Started:** ~14:00 ART
**Last Updated:** ~16:30 ART
**Project:** riqqsburgers-web
**Topic:** Push notifications para nuevos pedidos en el panel admin

---

## What We Are Building

Sistema de push notifications para los admins de cada restaurante. Cuando un cliente realiza un pedido nuevo, el admin recibe una notificación push en el navegador aunque la pestaña esté en segundo plano. Flujo: cliente hace pedido → `POST /api/orders` dispara push → Service Worker muestra notificación (`requireInteraction:true`) → click abre/focaliza la pestaña del admin.

Multi-tenant: cada restaurante solo recibe sus propias notificaciones. Las suscripciones se almacenan en Supabase (`push_subscriptions`) y se auto-limpian cuando expiran (410/404 del servidor push).

---

## What WORKED (with evidence)

- **Commit `ea8e219` completo** — `git log` confirma, 5 commits ahead of origin/main
- **`public/sw.js`** — maneja `push` event y `notificationclick`, abre/focaliza pestaña del admin
- **`/api/push/subscribe`** — POST guarda suscripción auth-gated, DELETE la elimina
- **`lib/push.ts`** — envía en paralelo a todos los admins del tenant, limpia subs expiradas (410/404)
- **`NotificationToggle`** — 5 estados: loading/off/on/denied/unsupported; integrado en AdminShell sidebar desktop + mobile menu
- **`POST /api/orders` dispara push** — fire-and-forget para no bloquear la respuesta al cliente

---

## What Did NOT Work (and why)

No failed approaches this session.

---

## What Has NOT Been Tried Yet

- Probar flujo completo end-to-end en browser real
- Confirmar si tabla `push_subscriptions` existe en Supabase o hay que crearla
- Agregar env vars en Vercel (BLOQUEANTE para deploy)

---

## Current State of Files

| File | Status | Notes |
|------|--------|-------|
| `public/sw.js` | Complete | Service Worker push + notificationclick |
| `app/api/push/subscribe/route.ts` | Complete | POST/DELETE auth-gated |
| `lib/push.ts` | Complete | sendPushToTenant, auto-cleanup expiradas |
| `app/api/orders/route.ts` | Complete | Dispara push al crear pedido |
| `components/admin/NotificationToggle.tsx` | Complete | Botón 🔔 con 5 estados |
| `components/admin/AdminShell.tsx` | Complete | NotificationToggle integrado |
| `components/catalog/CatalogClient.tsx` | **SIN COMMITEAR** | tilt 3D + ImmersiveView de sesiones anteriores |
| `app/globals.css` | **SIN COMMITEAR** | estilos tilt 3D de sesiones anteriores |

---

## Decisions Made

- **`requireInteraction: true`** — pedidos urgentes, no deben descartarse automáticamente
- **Fire-and-forget en `/api/orders`** — no bloquear respuesta al cliente si push falla
- **Limpieza automática de subs expiradas** — evitar acumulación de subs inválidas

---

## Blockers & Open Questions

**ENV VARS FALTANTES EN VERCEL — CRÍTICO antes del deploy:**

| Variable | Valor |
|---|---|
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | `BN_vPOY7uuk4awD9iDA4v2uvPkyVIPVC08rCfWEzVuQcEtJ4rLNacn3jnP-pUWLago0EVPc8YmzwD14lulHYLUs` |
| `VAPID_PRIVATE_KEY` | `pqvJ3kk0U-9q2LxXJm1NhOXbeX4EwuFgr2vOfqdgIGo` |
| `VAPID_EMAIL` | `mailto:francoriquero15@gmail.com` |

- **Tabla `push_subscriptions` en Supabase** — confirmar si existe; si no, migración:
  ```sql
  CREATE TABLE push_subscriptions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id text NOT NULL,
    user_id uuid NOT NULL,
    subscription jsonb NOT NULL,
    created_at timestamptz DEFAULT now()
  );
  CREATE INDEX ON push_subscriptions(tenant_id);
  ```
- **CatalogClient.tsx + globals.css sin commitear** — pendiente desde sesiones anteriores (tilt 3D + ImmersiveView)
- **5 commits sin pushear** — `git push` pendiente después de configurar env vars

---

## Exact Next Step

1. Abrir Vercel Dashboard → riqqsburgers-web → Settings → Environment Variables
2. Agregar las 3 variables arriba en entorno **Production**
3. Avisar a Claude → `git push` + deploy
4. Verificar en browser: botón 🔔 en admin + notificación al crear pedido de prueba
