---
name: storage-upload-fix
description: Fix aplicado al upload de logos — el browser no tiene sesión Supabase Auth, el upload debe ir via API route server-side con service role
metadata:
  type: project
---

El bucket `restaurant-logos` en Supabase (proyecto `dzsygeidjfncfhhhrefw`) tiene políticas RLS de INSERT/UPDATE que requieren `authenticated`. Takefyy **no usa Supabase Auth** para admins — usa cookie `admin_token` + env `ADMIN_SECRET`. El browser jamás tiene sesión autenticada en Supabase.

**Fix:** Creado `/api/tenant/[slug]/upload` (POST, multipart/form-data) que usa `createServerClient()` (service role) para subir al bucket. `RestaurantSettingsForm` ahora llama a ese endpoint en lugar de subir directo desde el browser con `createSupabaseBrowser()`.

**Why:** `createSupabaseBrowser()` usa la anon key sin sesión — Supabase rechaza el upload con 403 por violación de RLS.

**How to apply:** Cualquier upload a Storage desde un contexto de admin de Takefyy debe ir via API route server-side. Nunca usar `createSupabaseBrowser()` para storage operations en el panel admin.

[[auth-model]]
