# Auto-generar carrusel para Instagram (@takefyy)

Corré este runbook completo, sin pedirme confirmación en el medio.

## 1. Buscar el ítem de hoy

Abrí `content/ig-content-calendar-2026-07.json` y buscá en `schedule` la entrada cuyo `generate_date` sea la fecha de hoy. Si no hay ninguna, terminá sin hacer nada (no es un error, simplemente no toca generar hoy).

## 2. Generar el contenido

Con el campo `brief` de esa entrada como consigna, invocá el skill `carrusel-studio` para generar el carrusel (10 slides) siguiendo el sistema visual ya establecido de Takefyy: fondo oscuro `#0E1116`, acento `#FF6B35`, tipografía Anton (headlines) + Inter (body), mascota voxel/lego 3D, contador de slide `NN/10` arriba a la derecha, logo TAKEFYY abajo a la izquierda — igual al carrusel de referencia en `content/reference/carrusel-4/` (si no existe esa carpeta, usá las memorias `session_2026-06-29-takefyy-ig` y `session_2026-06-29-takefyy-hamburgueserias-carousel` para tono y ejemplos).

**Dominio correcto: `takefyy.com`.** Nunca `takefyy.vercel.app` (dominio viejo, ya no se usa) ni ningún otro. Cualquier mockup de URL, link en bio o mención del sitio tiene que decir `takefyy.com` o `takefyy.com/<slug-del-local>` (ej. `takefyy.com/riqqsburgers`).

**Priorizá ilustración por sobre texto plano — y priorizá foto real por sobre mockup dibujado.** El carrusel de referencia ("hamburgueserías", ver `session_2026-06-29-takefyy-hamburgueserias-carousel`) usa mockups de chat de WhatsApp, iconos, diagramas de flujo y gráficos SVG en casi todas las slides — no son bloques de texto sobre fondo liso. Apuntá a ese nivel de riqueza visual en cada slide. Pero cuando el contenido lo permita (mostrar comida, el menú real, el catálogo andando), preferí una foto/captura real por sobre un mockup CSS:

- **Fotos de producto**: los productos de cada tenant tienen `image_url` en la tabla `products` de Supabase (ya se suben desde el admin). Bajalas con la service key y usalas como `<img>` en vez de dibujar un plato con CSS.
- **Captura del menú público real**: para mostrar "así se ve tu catálogo", usá Playwright para sacarle un screenshot a `https://takefyy.com/<slug>` (o a `localhost:3000/<slug>` si estás corriendo el dev server) en vez de recrear un mockup de browser a mano. Recortá solo la parte relevante (ej. el catálogo de productos, el checkout).
- Si ninguna de las dos aplica para una slide puntual (un dato, una comparación, un flow conceptual), seguí usando SVG/CSS o generá el asset con el generador de ilustraciones de abajo — no fuerces una foto donde no corresponde.

Para gráficos que no se puedan resolver con foto real ni SVG/CSS puro (una ilustración, un ícono custom, una escena), generá el asset con:

```bash
npx tsx scripts/generate-illustration.ts "<prompt de la ilustración, fondo transparente, estilo flat/vector consistente con la marca>" tmp/ig-auto/<fecha>/illustration-N.png
```

y componela como `<img>` dentro del HTML de la slide (el texto sigue siendo texto real del DOM, nunca texto quemado dentro de la ilustración — así no hay riesgo de que la IA lo deforme). Esto es autónomo, no necesita revisión humana.

No repitas el copy exacto de ningún post en `already_published` del mismo JSON.

Exportá los PNGs finales a `tmp/ig-auto/<fecha-de-publish_date>/slide-01.png` ... `slide-10.png`.

## 3. Verificar

Antes de dar por terminado, chequeá:
- El ángulo coincide con el `brief` de la entrada.
- Ninguna slide menciona `takefyy.vercel.app` ni otro dominio — solo `takefyy.com`.
- Paleta, tipografía y tono son consistentes con la marca.
- Cada slide tiene al menos un elemento ilustrado/gráfico, no es solo texto sobre fondo liso (salvo las slides de puro número/stat, donde el número grande ya cumple ese rol).
- Redactá también el caption final (con CTA y hashtags, mismo tono que los posts ya publicados) y guardalo en `tmp/ig-auto/<fecha-de-publish_date>/caption.txt`.

Si algo no cierra (brief ambiguo, faltan assets), no fuerces nada — dejá un archivo `tmp/ig-auto/<fecha-de-publish_date>/SKIPPED.txt` explicando por qué y terminá. El runbook de publicación va a ver que no hay PNGs y no va a publicar.
