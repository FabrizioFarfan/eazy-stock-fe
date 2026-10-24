# Eazy Stock — PDF «qué es» (5 páginas)

- `EazyStock-que-es.pdf` — el PDF final, en español peruano, con capturas reales en celular.
- `build/eazystock.html` — la fuente. Se edita el HTML y se vuelve a generar.
- `shots/` — capturas usadas (negocio de pruebas, viewport 390 px).

Regenerar (necesita Chromium de Playwright):

```bash
node docs/pdf/build/render.cjs
```

# Eazy Stock — Presentación + guía de demo (18 diapositivas 16:9, clientes de España, precios en USD)

- `EazyStock-presentacion-demo.pdf` — parte 1: presentación (dos segmentos: negocio con libreta y empresa con miles de referencias en Excel, p. ej. metalúrgicas; el problema del Excel; «tu Excel es el punto de partida»; solución, beneficios, un día, funciones, para quién, cómo empezar, precios en USD); parte 2: guía de demo (preparación, ruta A empresa con Excel, ruta B negocio pequeño, objeciones, cierre). Español de España.
- Las capturas salen de eazy-stock.com con textos adaptados a España en el DOM antes de capturar ($ en vez de S/, Bizum en vez de Yape, nombres neutros).
- `presentacion/deck.html` — la fuente; `presentacion/img/` — mockups capturados de eazy-stock.com/funciones y fotos de los rubros.
- Regenerar: `PW=<ruta a playwright-core/index.mjs> CHROME=<chromium> node docs/pdf/presentacion/render.mjs` (con `PREVIEW=<dir>` saca un PNG por diapositiva).
- Precios y promo copiados de `src/pages/landing/plans.js` (oct 2026): si cambian allí, actualizar la diapositiva 12.
