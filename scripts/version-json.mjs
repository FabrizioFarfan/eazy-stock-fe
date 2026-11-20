// Ley del despliegue (18-nov-2026): la versión desplegada se comprueba en el dominio. Deja dist/version.json tras el build.
import { readFileSync, writeFileSync } from 'node:fs'

const { version } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url)))
writeFileSync(new URL('../dist/version.json', import.meta.url), JSON.stringify({ name: 'Eazy Stock web', version, builtAt: new Date().toISOString() }) + '\n')
console.log(`version.json → ${version}`)
