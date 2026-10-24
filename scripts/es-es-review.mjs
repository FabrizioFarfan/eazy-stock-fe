// Vuelca cada texto en español que toca la capa es-ES (src/i18n/esES.js) con
// su versión de España, para revisarla a ojo:  node scripts/es-es-review.mjs
// Busca en las llaves de src/i18n/dict y en los literales del código.
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spainVariant } from '../src/i18n/esES.js'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const re = /celular|computadora|cotiza/i
const keys = new Set()
for (const f of readdirSync(join(root, 'src/i18n/dict'))) {
  const m = await import(join(root, 'src/i18n/dict', f))
  const d = m.default ?? m
  for (const lang of ['en', 'it']) for (const k of Object.keys(d[lang] ?? {})) if (re.test(k)) keys.add(k)
}
function walk(dir) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f)
    if (statSync(p).isDirectory()) { if (f !== 'dict') walk(p); continue }
    if (!/\.(jsx?|mjs)$/.test(f) || f === 'esES.js') continue
    for (const m of readFileSync(p, 'utf8').matchAll(/t\(\s*'((?:[^'\\\n]|\\.)*)'/g)) if (re.test(m[1])) keys.add(m[1])
  }
}
walk(join(root, 'src'))
let n = 0
for (const k of [...keys].sort()) {
  const v = spainVariant(k)
  console.log(`${v === k ? '=' : '~'} ${k}\n  → ${v}\n`)
  if (/celular|computadora|cotizaci/i.test(v)) n++
}
console.error(`${keys.size} textos; ${n} siguen con la palabra de LatAm`)
