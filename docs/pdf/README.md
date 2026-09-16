# Eazy Stock — PDF «qué es» (5 páginas)

- `EazyStock-que-es.pdf` — el PDF final, en español peruano, con capturas reales en celular.
- `build/eazystock.html` — la fuente. Se edita el HTML y se vuelve a generar.
- `shots/` — capturas usadas (negocio de pruebas, viewport 390 px).

Regenerar (necesita Chromium de Playwright):

```bash
node docs/pdf/build/render.cjs
```
