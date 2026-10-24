# Eazy Stock — PDF «qué es» (5 páginas)

- `EazyStock-que-es.pdf` — el PDF final, en español peruano, con capturas reales en celular.
- `build/eazystock.html` — la fuente. Se edita el HTML y se vuelve a generar.
- `shots/` — capturas usadas (negocio de pruebas, viewport 390 px).

Regenerar (necesita Chromium de Playwright):

```bash
node docs/pdf/build/render.cjs
```

# Eazy Stock — Presentación + guía de demo (15 diapositivas 16:9)

- `EazyStock-presentacion-demo.pdf` — parte 1: presentación para el cliente (problema, solución, beneficios, un día, funciones, para quién, cómo empezar, precios); parte 2: guía para quien hace la demo (preparación, guion de 15 min, objeciones, cierre).
- `presentacion/deck.html` — la fuente; `presentacion/img/` — mockups capturados de eazy-stock.com/funciones y fotos de los rubros.
- Regenerar: `PW=<ruta a playwright-core/index.mjs> CHROME=<chromium> node docs/pdf/presentacion/render.mjs` (con `PREVIEW=<dir>` saca un PNG por diapositiva).
- Precios y promo copiados de `src/pages/landing/plans.js` (oct 2026): si cambian allí, actualizar la diapositiva 10.
