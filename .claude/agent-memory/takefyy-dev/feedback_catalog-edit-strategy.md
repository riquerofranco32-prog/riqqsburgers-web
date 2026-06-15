---
name: catalog-edit-strategy
description: CatalogClient.tsx es demasiado grande para editar con Edit tool — usar node script para reemplazos de bloques grandes
metadata:
  type: feedback
---

`CatalogClient.tsx` tiene más de 4000 líneas. El Edit tool falla recurrentemente con "file modified since read" porque un formateador (probablemente el IDE) toca el archivo entre la lectura y la escritura. 

**Why:** Bloques grandes con caracteres especiales (backticks, JSX anidado) son propensos al error de concurrencia del Edit tool.

**How to apply:** Para reemplazos de bloques grandes en este archivo (>50 líneas), escribir un script `.mjs` con `fs.readFileSync` + `indexOf` + `slice` y ejecutarlo con `node`. Borra el script después. Para cambios pequeños (1-5 líneas), el Edit tool funciona sin problema.
