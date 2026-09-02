// Teléfonos con prefijo de país (tarea 212, sep-2026).
//
// Antes el formulario exigía 9 dígitos exactos (formato Lima) y WhatsApp
// anteponía 51 a ciegas: un número italiano no entraba. Ahora se guarda en
// E.164 ("+51987654321", "+393331234567") y el país por defecto es el del
// negocio (lo fija el AuthContext con `setDefaultCountry`).
//
// Los teléfonos ya guardados sin "+" (los 9 dígitos peruanos de siempre) se
// siguen entendiendo como nacionales del país del negocio: nada se rompe.

// `example`: un número de muestra del país, para el placeholder del input (cambia con el prefijo)
export const COUNTRIES = [
  { iso: 'PE', dial: '51',  name: 'Perú',            flag: '🇵🇪', example: '987 654 321' },
  { iso: 'AR', dial: '54',  name: 'Argentina',       flag: '🇦🇷', example: '11 2345 6789' },
  { iso: 'BO', dial: '591', name: 'Bolivia',         flag: '🇧🇴', example: '712 34567' },
  { iso: 'BR', dial: '55',  name: 'Brasil',          flag: '🇧🇷', example: '11 91234 5678' },
  { iso: 'CL', dial: '56',  name: 'Chile',           flag: '🇨🇱', example: '9 6123 4567' },
  { iso: 'CO', dial: '57',  name: 'Colombia',        flag: '🇨🇴', example: '312 345 6789' },
  { iso: 'CR', dial: '506', name: 'Costa Rica',      flag: '🇨🇷', example: '8312 3456' },
  { iso: 'CU', dial: '53',  name: 'Cuba',            flag: '🇨🇺', example: '5 123 4567' },
  { iso: 'DO', dial: '1',   name: 'Rep. Dominicana', flag: '🇩🇴', example: '809 234 5678' },
  { iso: 'EC', dial: '593', name: 'Ecuador',         flag: '🇪🇨', example: '99 123 4567' },
  { iso: 'SV', dial: '503', name: 'El Salvador',     flag: '🇸🇻', example: '7012 3456' },
  { iso: 'GT', dial: '502', name: 'Guatemala',       flag: '🇬🇹', example: '5123 4567' },
  { iso: 'HN', dial: '504', name: 'Honduras',        flag: '🇭🇳', example: '9123 4567' },
  { iso: 'MX', dial: '52',  name: 'México',          flag: '🇲🇽', example: '55 1234 5678' },
  { iso: 'NI', dial: '505', name: 'Nicaragua',       flag: '🇳🇮', example: '8123 4567' },
  { iso: 'PA', dial: '507', name: 'Panamá',          flag: '🇵🇦', example: '6123 4567' },
  { iso: 'PY', dial: '595', name: 'Paraguay',        flag: '🇵🇾', example: '981 123 456' },
  { iso: 'UY', dial: '598', name: 'Uruguay',         flag: '🇺🇾', example: '94 123 456' },
  { iso: 'VE', dial: '58',  name: 'Venezuela',       flag: '🇻🇪', example: '412 123 4567' },
  { iso: 'US', dial: '1',   name: 'Estados Unidos',  flag: '🇺🇸', example: '201 555 0123' },
  { iso: 'CA', dial: '1',   name: 'Canadá',          flag: '🇨🇦', example: '416 555 0123' },
  { iso: 'ES', dial: '34',  name: 'España',          flag: '🇪🇸', example: '612 345 678' },
  { iso: 'IT', dial: '39',  name: 'Italia',          flag: '🇮🇹', example: '333 123 4567' },
  { iso: 'PT', dial: '351', name: 'Portugal',        flag: '🇵🇹', example: '912 345 678' },
  { iso: 'FR', dial: '33',  name: 'Francia',         flag: '🇫🇷', example: '6 12 34 56 78' },
  { iso: 'DE', dial: '49',  name: 'Alemania',        flag: '🇩🇪', example: '151 2345 6789' },
  { iso: 'GB', dial: '44',  name: 'Reino Unido',     flag: '🇬🇧', example: '7400 123456' },
  { iso: 'IE', dial: '353', name: 'Irlanda',         flag: '🇮🇪', example: '85 123 4567' },
  { iso: 'NL', dial: '31',  name: 'Países Bajos',    flag: '🇳🇱', example: '6 1234 5678' },
  { iso: 'BE', dial: '32',  name: 'Bélgica',         flag: '🇧🇪', example: '470 12 34 56' },
  { iso: 'CH', dial: '41',  name: 'Suiza',           flag: '🇨🇭', example: '78 123 45 67' },
  { iso: 'AT', dial: '43',  name: 'Austria',         flag: '🇦🇹', example: '664 123 4567' },
  { iso: 'PL', dial: '48',  name: 'Polonia',         flag: '🇵🇱', example: '512 345 678' },
  { iso: 'CZ', dial: '420', name: 'Chequia',         flag: '🇨🇿', example: '601 123 456' },
  { iso: 'RO', dial: '40',  name: 'Rumanía',         flag: '🇷🇴', example: '712 345 678' },
  { iso: 'GR', dial: '30',  name: 'Grecia',          flag: '🇬🇷', example: '691 234 5678' },
  { iso: 'SE', dial: '46',  name: 'Suecia',          flag: '🇸🇪', example: '70 123 45 67' },
  { iso: 'NO', dial: '47',  name: 'Noruega',         flag: '🇳🇴', example: '412 34 567' },
  { iso: 'DK', dial: '45',  name: 'Dinamarca',       flag: '🇩🇰', example: '20 12 34 56' },
  { iso: 'TR', dial: '90',  name: 'Turquía',         flag: '🇹🇷', example: '501 234 56 78' },
  { iso: 'MA', dial: '212', name: 'Marruecos',       flag: '🇲🇦', example: '612 345 678' },
  { iso: 'CN', dial: '86',  name: 'China',           flag: '🇨🇳', example: '131 2345 6789' },
  { iso: 'JP', dial: '81',  name: 'Japón',           flag: '🇯🇵', example: '90 1234 5678' },
  { iso: 'IN', dial: '91',  name: 'India',           flag: '🇮🇳', example: '91234 56789' },
  { iso: 'AU', dial: '61',  name: 'Australia',       flag: '🇦🇺', example: '412 345 678' },
]

const BY_ISO = Object.fromEntries(COUNTRIES.map((c) => [c.iso, c]))
// Prefijos más largos primero, así "+593…" no se lee como "+59" ni "+5".
const BY_DIAL_ORDER = [...COUNTRIES].sort((a, b) => b.dial.length - a.dial.length)

let defaultIso = 'PE'

/** La fija el AuthContext con el país del negocio del usuario logueado. */
export function setDefaultCountry(iso) {
  defaultIso = BY_ISO[iso] ? iso : 'PE'
}
export function getDefaultCountry() { return defaultIso }
export function countryByIso(iso) { return BY_ISO[iso] ?? BY_ISO[defaultIso] }

/**
 * Descompone lo que haya guardado en { iso, dial, national }.
 *  - "+393331234567" → IT / 39 / 3331234567
 *  - "987654321" (sin "+", legado) → país por defecto (PE / 51)
 *  - "" → { iso: default, national: '' }
 */
export function splitPhone(raw, iso = defaultIso) {
  const s = String(raw ?? '').trim()
  const digits = s.replace(/\D/g, '')
  if (s.startsWith('+') || s.startsWith('00')) {
    const d = s.startsWith('00') ? digits.slice(2) : digits
    // Los que comparten +1 (US/CA/DO): se prefiere el país por defecto si también es +1.
    const preferred = BY_ISO[iso]
    if (preferred && d.startsWith(preferred.dial)) {
      return { iso: preferred.iso, dial: preferred.dial, national: d.slice(preferred.dial.length) }
    }
    const c = BY_DIAL_ORDER.find((x) => d.startsWith(x.dial))
    if (c) return { iso: c.iso, dial: c.dial, national: d.slice(c.dial.length) }
    return { iso: '', dial: '', national: d }
  }
  const c = countryByIso(iso)
  return { iso: c.iso, dial: c.dial, national: digits }
}

/** Arma el E.164 ("+51987654321"); vacío si no hay número nacional. */
export function toE164(iso, national) {
  const n = String(national ?? '').replace(/\D/g, '').replace(/^0+/, '')
  if (!n) return ''
  const c = countryByIso(iso)
  return `+${c.dial}${n}`
}

/** Válido: vacío, o E.164 con 6 a 15 dígitos (la longitud real la pone cada país). */
export function isValidPhone(raw) {
  const s = String(raw ?? '').trim()
  if (!s) return true
  return /^\+\d{6,15}$/.test(s)
}

/** Para mostrar: "+51 987 654 321". Lo legado sin prefijo se muestra con el del negocio. */
export function formatPhoneDisplay(raw, iso = defaultIso) {
  const s = String(raw ?? '').trim()
  if (!s) return ''
  const { dial, national } = splitPhone(s, iso)
  if (!dial) return s
  return `+${dial} ${groupDigits(national)}`
}

function groupDigits(n) {
  // 987654321 → 987 654 321 · 3331234567 → 333 123 4567 (grupos de 3, resto al final)
  const out = []
  let i = 0
  while (i < n.length) {
    const left = n.length - i
    const size = left === 4 ? 4 : 3
    out.push(n.slice(i, i + size))
    i += size
  }
  return out.join(' ')
}

/** Solo dígitos con prefijo, como lo quiere wa.me: "51987654321". */
export function whatsappDigits(raw, iso = defaultIso) {
  const s = String(raw ?? '').trim()
  if (!s) return ''
  const { dial, national } = splitPhone(s, iso)
  return dial ? `${dial}${national}` : s.replace(/\D/g, '')
}
