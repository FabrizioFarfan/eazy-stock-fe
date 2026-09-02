// Prerender de la landing para Google (SEO, 2-sep-2026).
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
import { readFile, writeFile, stat } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { extname, join } from 'node:path'

const DIST = new URL('../dist/', import.meta.url).pathname
const PORT = 4179
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
  try {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce', locale: 'es-PE' })
    const page = await ctx.newPage()
    await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle' })
    await page.waitForSelector('h1', { timeout: 15000 })
    await page.waitForTimeout(800)
    const html = await page.evaluate(() => document.getElementById('root').innerHTML)
    const h1 = await page.evaluate(() => document.querySelector('h1')?.textContent ?? '')
    const indexPath = join(DIST, 'index.html')
    const index = await readFile(indexPath, 'utf8')
    const out = index.replace('<div id="root"></div>', `<div id="root"><div data-prerender>${html}</div></div>`)
    if (out === index) throw new Error('no se encontró <div id="root"></div> en dist/index.html')
    await writeFile(indexPath, out)
    console.log(`[prerender] landing incrustada en dist/index.html (${(html.length / 1024).toFixed(0)} KB) · h1: ${h1.slice(0, 60)}`)
  } finally {
    await browser.close()
    server.close()
  }
}

main().catch((e) => {
  console.warn('[prerender] falló, el build sigue sin prerender:', e.message)
})
