// Genera ../EazyStock-presentacion-demo.pdf y preview-N.png desde deck.html.
//   node docs/pdf/presentacion/render.mjs   (PW = ruta a playwright-core, CHROME = ejecutable de Chromium)
import { fileURLToPath } from 'node:url'
import path from 'node:path'
const dir = path.dirname(fileURLToPath(import.meta.url))
const PW = process.env.PW ?? 'playwright-core'
const { chromium } = await import(PW)
const b = await chromium.launch({ executablePath: process.env.CHROME, args: ['--no-sandbox'] })
const p = await b.newPage({ viewport: { width: 1920, height: 1080 } })
await p.goto('file://' + dir + '/deck.html', { waitUntil: 'networkidle' })
await p.evaluate(() => document.fonts.ready)
await p.pdf({ path: dir + '/../EazyStock-presentacion-demo.pdf', width: '1920px', height: '1080px', printBackground: true, preferCSSPageSize: true })
if (process.env.PREVIEW) {
  const n = await p.locator('section.s').count()
  for (let i = 0; i < n; i++) await p.locator('section.s').nth(i).screenshot({ path: `${process.env.PREVIEW}/preview-${i + 1}.png` })
  console.log('slides', n)
}
await b.close()
