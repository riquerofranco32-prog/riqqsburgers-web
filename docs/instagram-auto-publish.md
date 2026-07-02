# Auto-publish a Instagram (@takefyy)

Corré este runbook completo, sin pedirme confirmación en el medio. Publicás en la cuenta real de Instagram — seguí los pasos en orden y si algo no cierra, no publiques: dejá un comentario en la tarea de Asana explicando por qué se saltó y terminá ahí.

## 1. Buscar el ítem de hoy

Buscá en Asana (proyecto de contenido Takefyy, ver memoria `reference_daily-routine-takefyy-altum` para contexto del workspace) una tarea de tipo Instagram (carrusel o historia) con fecha de vencimiento hoy y que no esté completada. Si no hay ninguna, terminá sin hacer nada.

## 2. Generar el contenido

Con esa tarea como brief, invocá el skill `carrusel-studio` para generar el carrusel (o la historia, según lo que pida la tarea) siguiendo el sistema visual ya establecido de Takefyy (Anton + Inter, `#0E1116` fondo oscuro, acento `#FF6B35` — ver memorias `session_2026-06-29-takefyy-ig` y `session_2026-06-29-takefyy-hamburgueserias-carousel` para tono y ejemplos previos). Exportá los PNGs finales a `tmp/ig-auto/<fecha>/`.

## 3. Verificar antes de publicar

Antes de subir nada, chequeá:
- El tema/ángulo del contenido generado coincide con la descripción de la tarea de Asana (no te desvíes del brief).
- No es un tema repetido: revisá los últimos 5 posts publicados por este runbook (comentarios en tareas de Asana con "✅ publicado" son el registro) y confirmá que no se repite ángulo/gancho.
- Paleta, tipografía y tono son consistentes con la marca.
- El caption no tiene errores y tiene un CTA claro.

Si algo de esto falla, no publiques — comentá en la tarea de Asana qué falló y terminá.

## 4. Publicar

Desde la raíz del repo (`riqqsburgers-web`), corré:

```bash
# Carrusel (2-10 imágenes)
npx tsx scripts/publish-instagram.ts carousel "<caption final>" tmp/ig-auto/<fecha>/slide-1.png tmp/ig-auto/<fecha>/slide-2.png ...

# Historia (1 imagen)
npx tsx scripts/publish-instagram.ts story tmp/ig-auto/<fecha>/story.png
```

El script sube las imágenes al bucket de Supabase y publica directo en @takefyy usando `IG_ACCESS_TOKEN`/`IG_BUSINESS_ID` de `.env.local`. Devuelve `{ mediaId, imageUrls }` en stdout si salió bien.

## 5. Cerrar el loop

Marcá la tarea de Asana como completada y agregá un comentario: `✅ publicado — media_id: <mediaId>` (así el paso 3 de la próxima corrida puede chequear duplicados).

Si el script falla (token vencido, error de Graph API, etc.), NO reintentes más de una vez. Comentá el error en la tarea de Asana y terminá — un humano lo revisa después.
