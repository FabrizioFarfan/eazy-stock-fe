// Prerender de la web pública para Google (SEO, 2-sep-2026; multipágina 25-sep-2026).
//
// Eazy Stock es una SPA: sin esto, un buscador que no ejecute JS ve un
// <div id="root"> vacío. Después de `vite build` este script sirve dist/ en
// un puerto local, abre "/" con Chromium (reduced-motion → los Reveal salen
// visibles), copia el HTML ya pintado dentro de #root envuelto en
// <div data-prerender> y lo guarda en dist/index.html. En el navegador React
// lo reemplaza al montar; si hay sesión o la URL no es la portada, el
// <script> de index.html lo oculta antes del primer pintado.
//
// Si no hay Chromium en esta máquina se avisa y el build sigue igual: la
// landing sigue funcionando, solo que sin el HTML estático.
import { createServer } from 'node:http'
import { readFile, writeFile, stat, mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { extname, join, dirname } from 'node:path'

const DIST = new URL('../dist/', import.meta.url).pathname
const PORT = 4179
// Web pública multipágina (25-sep-2026): un HTML por página
const ROUTES = ['/', '/funciones', '/para-quien', '/planes', '/preguntas']
const CHROME = process.env.PRERENDER_CHROME
  || ['/root/.cache/ms-playwright/chromium-1228/chrome-linux64/chrome'].find((p) => existsSync(p))

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.woff2': 'font/woff2', '.jpg': 'image/jpeg', '.mp4': 'video/mp4' }

function serve() {
  const server = createServer(async (req, res) => {
    const url = new URL(req.url, 'http://x')
    let file = join(DIST, url.pathname)
    try {
      const s = await stat(file)
      if (s.isDirectory()) file = join(file, 'index.html')
    } catch {
      file = join(DIST, 'index.html') // SPA fallback
    }
    try {
      const body = await readFile(file)
      res.writeHead(200, { 'content-type': MIME[extname(file)] ?? 'application/octet-stream' })
      res.end(body)
    } catch {
      res.writeHead(404); res.end()
    }
  })
  return new Promise((resolve) => server.listen(PORT, '127.0.0.1', () => resolve(server)))
}

async function main() {
  if (!CHROME) {
    console.warn('[prerender] sin Chromium (PRERENDER_CHROME no definido): se deja el index.html tal cual')
    return
  }
  let chromium
  try {
    ({ chromium } = await import('playwright-core'))
  } catch {
    console.warn('[prerender] falta playwright-core: se deja el index.html tal cual')
    return
  }
  const server = await serve()
  const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] })
  const template = await readFile(join(DIST, 'index.html'), 'utf8')
  try {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce', locale: 'es-PE' })
    for (const route of ROUTES) {
      const page = await ctx.newPage()
      await page.goto(`http://127.0.0.1:${PORT}${route}`, { waitUntil: 'networkidle' })
      await page.waitForSelector('h1', { timeout: 15000 })
      await page.waitForTimeout(800)
      const { html, h1, title, desc } = await page.evaluate(() => ({
        html: document.getElementById('root').innerHTML,
        h1: document.querySelector('h1')?.textContent ?? '',
        title: document.title,
        desc: document.querySelector('meta[name="description"]')?.getAttribute('content') ?? '',
      }))
      await page.close()
      const url = `https://eazy-stock.com${route === '/' ? '/' : route}`
      let out = template.replace('<div id="root"></div>', `<div id="root"><div data-prerender>${html}</div></div>`)
      if (out === template) throw new Error('no se encontró <div id="root"></div> en dist/index.html')
      if (route !== '/') {
        // Cada página con su título, descripción y URL propios para Google
        const esc = (v) => v.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
        out = out
          .replace(/<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`)
          .replace(/(<meta name="description" content=")[^"]*(")/, `$1${esc(desc)}$2`)
          .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${esc(title)}$2`)
          .replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${esc(desc)}$2`)
          .replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${url}$2`)
          .replace(/(<meta property="og:url" content=")[^"]*(")/, `$1${url}$2`)
      }
      // "/" → dist/index.html · "/funciones" → dist/funciones/index.html
      // (nginx: try_files $uri $uri/index.html /index.html)
      const target = route === '/' ? join(DIST, 'index.html') : join(DIST, route.slice(1), 'index.html')
      await mkdir(dirname(target), { recursive: true })
      await writeFile(target, out)
      console.log(`[prerender] ${route} → ${target.replace(DIST, 'dist/')} (${(html.length / 1024).toFixed(0)} KB) · h1: ${h1.slice(0, 50)}`)
    }
  } finally {
    await browser.close()
    server.close()
  }
}

main().catch((e) => {
  console.warn('[prerender] falló, el build sigue sin prerender:', e.message)
})
