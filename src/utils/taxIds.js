// Documento fiscal del negocio (RUC, CUIT, RUT, NIT, NIF, RFC…): espejo EXACTO de
// util/TaxIds.java del API 1.15.0 (misma normalización, mismos algoritmos, mismos
// mensajes en español). Sin imports a propósito: lo prueba `npm test` con node
// contra src/utils/__fixtures__/tax-ids.json (copia de src/test/resources/tax-ids.json
// del backend). Los textos traducidos para la UI están en ./taxIdText.js.
//
// Si cambia TaxIds.java, cambia esto y vuelve a copiar la tabla de casos.

/**
 * MX: exigir el dígito verificador de la homoclave (como el backend). Si el API lo
 * pone en false, aquí también: se sigue exigiendo el formato y la fecha.
 */
export const MX_ENFORCE_CHECK_DIGIT = true

const PE_AR_WEIGHTS = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2]
const CO_WEIGHTS = [3, 7, 13, 17, 19, 23, 29, 37, 41, 43, 47, 53, 59, 67, 71]
const UY_WEIGHTS = [4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
const DO_WEIGHTS = [7, 9, 8, 6, 5, 4, 3, 2]
const VE_WEIGHTS = [3, 2, 7, 6, 5, 4, 3, 2]
const ES_DNI_LETTERS = 'TRWAGMYFPDXBNJZSQVHLCKE'
const MX_ALPHABET = '0123456789ABCDEFGHIJKLMN&OPQRSTUVWXYZ Ñ'
const AR_PREFIXES = new Set(['20', '23', '24', '27', '30', '33', '34', '50', '51', '55'])
const PE_PREFIXES = new Set(['10', '15', '17', '20'])
/** RNC reales que no cumplen el módulo 11 (lista de python-stdnum, do/rnc.py). */
const DO_RNC_WHITELIST = new Set([
  '101581601', '101582245', '101595422', '101595785', '10233317', '131188691', '401007374',
  '501341601', '501378067', '501620371', '501651319', '501651823', '501651845', '501651926',
  '501656006', '501658167', '501670785', '501676936', '501680158', '504654542', '504680029',
  '504681442', '505038691',
])
/** RFC genéricos del SAT (público en general / extranjero): no identifican a un negocio. */
const MX_GENERIC = new Set(['XAXX010101000', 'XEXX010101000'])

// ── normalización ─────────────────────────────────────────────────────────

/**
 * Quita espacios, puntos y guiones y pasa a mayúsculas: «20 123.456-786» → «20123456786»,
 * «61.704.000-k» → «61704000K». No toca letras, «&» ni «Ñ». Vacío → null.
 * Los espacios son los de `\s` de Java (espacio, tab, salto de línea, \v, \f, \r),
 * no los Unicode que añadiría `\s` de JS.
 */
export function normalize(raw) {
  if (raw == null) return null
  const s = String(raw).replace(/[ \t\n\v\f\r.-]/g, '').toUpperCase()
  return s === '' ? null : s
}

// ── nombre por país ───────────────────────────────────────────────────────

/** Tipo que el API guarda en businesses.tax_id_type según el país. */
export function typeFor(countryCode) {
  switch (cc(countryCode)) {
    case 'PE': case 'EC': case 'PY': case 'PA': case 'NI': return 'RUC'
    case 'AR': return 'CUIT'
    case 'CL': case 'UY': return 'RUT'
    case 'CO': case 'BO': case 'GT': case 'SV': return 'NIT'
    case 'MX': return 'RFC'
    case 'ES': return 'NIF'
    case 'VE': return 'RIF'
    case 'DO': return 'RNC'
    case 'HN': return 'RTN'
    case 'CR': return 'CEDULA_JURIDICA'
    default: return 'TAX_ID'
  }
}

/** Etiqueta del formulario (CountryConfig.taxIdLabel): «RUC», «Cédula jurídica»… («TAX_ID» si no se conoce). */
export function labelFor(countryCode) {
  return cc(countryCode) === 'CR' ? 'Cédula jurídica' : typeFor(countryCode)
}

/** Nombre dentro de una frase: «RUC», «NIF», «cédula jurídica», «número de identificación fiscal». */
export function docName(countryCode) {
  const type = typeFor(countryCode)
  if (type === 'CEDULA_JURIDICA') return 'cédula jurídica'
  return type === 'TAX_ID' ? 'número de identificación fiscal' : type
}

/** El documento es femenino («Esta cédula jurídica»): solo Costa Rica. */
export function isFeminineDoc(countryCode) {
  return cc(countryCode) === 'CR'
}

function thisDoc(countryCode) {
  return (isFeminineDoc(countryCode) ? 'Esta ' : 'Este ') + docName(countryCode)
}

/** 409 DUPLICATE_TAX_ID: «Este RUC ya tiene una cuenta en Eazy Stock. Si es tuyo, inicia sesión o escríbenos.» */
export function duplicateMessage(countryCode) {
  return thisDoc(countryCode) + ' ya tiene una cuenta en Eazy Stock. Si es tuyo, inicia sesión o escríbenos.'
}

/** Qué revisar, en palabras del país (la segunda mitad del 400 del API). */
export function invalidHint(countryCode) {
  switch (cc(countryCode)) {
    case 'PE': return 'son 11 dígitos, empieza por 10, 15, 17 o 20 y el último es el verificador de SUNAT.'
    case 'AR': return 'son 11 dígitos (así: 30-12345678-D) y el último es el verificador.'
    case 'CL': return 'son 7 u 8 dígitos y el verificador (un número o K), así: 12.345.678-K.'
    case 'CO': return 'escríbelo con el dígito de verificación (DV) al final, así: 900.123.456-D.'
    case 'EC': return 'son 13 dígitos (los de tu RUC del SRI, terminados en 001) y deben cuadrar con su verificador.'
    case 'UY': return 'son 12 dígitos (así: 21-123456-001-D) y el último es el verificador.'
    case 'ES': return 'revisa el NIF, NIE o CIF y su letra o dígito de control (por ejemplo B12345674).'
    case 'MX': return 'son 12 caracteres para persona moral o 13 para persona física (letras, fecha AAMMDD y homoclave) y el último es el verificador.'
    case 'VE': return 'es una letra (V, E, J, P o G), 8 dígitos y el verificador, así: J-12345678-D.'
    case 'GT': return 'son los dígitos y el verificador (un número o K), así: 1234567-D, o tu CUI de 13 dígitos.'
    case 'PY': return 'son los dígitos y el dígito verificador, así: 80012345-D.'
    case 'DO': return 'son 9 dígitos (RNC) o los 11 de la cédula.'
    case 'SV': return 'son los 14 dígitos del NIT (así: 0614-010101-101-D) o los 9 del DUI.'
    case 'BO': return 'son de 6 a 12 dígitos.'
    case 'CR': return 'son de 9 a 12 dígitos (cédula jurídica, física o DIMEX).'
    case 'PA': return 'son de 5 a 20 letras o números.'
    case 'HN': return 'son 14 dígitos.'
    case 'NI': return 'son 14 caracteres (por ejemplo J0310000000000).'
    default: return 'debe tener entre 6 y 20 letras o números.'
  }
}

/** 400 del API, tal cual: «Este RUC no es válido: son 11 dígitos…». */
export function invalidMessage(countryCode) {
  return thisDoc(countryCode) + ' no es válido: ' + invalidHint(countryCode)
}

// ── validación ────────────────────────────────────────────────────────────

/** Válido para el país (el valor ya normalizado). */
export function isValidFor(countryCode, n) {
  if (n == null || !/^[A-Z0-9&Ñ]+$/.test(n)) return false
  switch (cc(countryCode)) {
    case 'PE': return isValidPeruRuc(n)
    case 'AR': return isValidArCuit(n)
    case 'CL': return isValidClRut(n)
    case 'CO': return isValidCoNit(n)
    case 'EC': return isValidEcRuc(n)
    case 'UY': return isValidUyRut(n)
    case 'ES': return isValidEsNif(n)
    case 'MX': return isValidMxRfc(n)
    case 'VE': return isValidVeRif(n)
    case 'GT': return isValidGtNit(n)
    case 'PY': return isValidPyRuc(n)
    case 'DO': return isValidDoRnc(n)
    case 'SV': return isValidSvNit(n)
    case 'BO': return /^\d{6,12}$/.test(n)
    case 'CR': return /^\d{9,12}$/.test(n)
    case 'PA': return /^[A-Z0-9]{5,20}$/.test(n)
    case 'HN': return /^\d{14}$/.test(n)
    case 'NI': return /^(?:J\d{13}|\d{13}[A-Z]|[A-Z]\d{13})$/.test(n)
    default: return /^[A-Z0-9]{6,20}$/.test(n)
  }
}

/** RUC peruano: 11 dígitos, prefijo 10/15/17/20 (el 16 no: padrón de SUNAT) y verificador módulo 11. */
export function isValidPeruRuc(n) {
  if (n == null || !/^\d{11}$/.test(n) || !PE_PREFIXES.has(n.slice(0, 2))) return false
  const check = (11 - weighted(n, PE_AR_WEIGHTS) % 11) % 10
  return check === digit(n, 10)
}

function isValidArCuit(n) {
  if (!/^\d{11}$/.test(n) || !AR_PREFIXES.has(n.slice(0, 2))) return false
  const r = 11 - weighted(n, PE_AR_WEIGHTS) % 11 // 1..11
  return (r === 11 ? 0 : r === 10 ? 9 : r) === digit(n, 10)
}

function isValidClRut(n) {
  if (!/^\d{7,8}[0-9K]$/.test(n)) return false
  const body = n.slice(0, -1)
  let sum = 0
  for (let i = 0; i < body.length; i++) sum += digit(body, body.length - 1 - i) * (2 + i % 6)
  const r = 11 - sum % 11
  const dv = r === 11 ? '0' : r === 10 ? 'K' : String(r)
  return dv === n[n.length - 1]
}

function isValidCoNit(n) {
  if (!/^\d{8,16}$/.test(n)) return false
  const body = n.slice(0, -1)
  let sum = 0
  for (let i = 0; i < body.length; i++) sum += digit(body, body.length - 1 - i) * CO_WEIGHTS[i]
  const r = sum % 11
  const dv = r < 2 ? r : 11 - r
  return dv === digit(n, n.length - 1)
}

function isValidEcRuc(n) {
  if (!/^\d{13}$/.test(n)) return false
  const prov = n.slice(0, 2)
  if ((prov < '01' || prov > '24') && prov !== '30' && prov !== '50') return false
  const third = n[2]
  if (third < '6') return ecNatural(n)
  if (third === '6') return ecPublic(n) || ecNatural(n)
  if (third === '9') return ecPublic(n) || ecPrivate(n)
  return false
}

function ecNatural(n) {
  if (n.endsWith('000') || n[2] > '6') return false
  let sum = 0
  for (let i = 0; i < 10; i++) {
    const v = digit(n, i) * (i % 2 === 0 ? 2 : 1)
    sum += v > 9 ? v - 9 : v
  }
  return sum % 10 === 0
}

function ecPublic(n) {
  return !n.endsWith('0000') && weighted(n, [3, 2, 7, 6, 5, 4, 3, 2, 1]) % 11 === 0
}

function ecPrivate(n) {
  return !n.endsWith('000') && weighted(n, [4, 3, 2, 7, 6, 5, 4, 3, 2, 1]) % 11 === 0
}

function isValidUyRut(n) {
  if (!/^\d{12}$/.test(n)) return false
  const reg = n.slice(0, 2)
  if (reg < '01' || reg > '22') return false
  if (n.slice(2, 8) === '000000' || n.slice(8, 11) !== '001') return false
  const dv = floorMod(-weighted(n, UY_WEIGHTS), 11)
  return dv < 10 && dv === digit(n, 11)
}

function isValidEsNif(n) {
  if (n.length !== 9 || !/^\d{7}$/.test(n.slice(1, 8))) return false
  const first = n[0]
  const last = n[8]
  if (/[0-9]/.test(first)) { // DNI
    return ES_DNI_LETTERS[Number(n.slice(0, 8)) % 23] === last
  }
  if ('XYZ'.includes(first)) { // NIE
    return ES_DNI_LETTERS[Number(String('XYZ'.indexOf(first)) + n.slice(1, 8)) % 23] === last
  }
  if ('KLM'.includes(first)) { // NIF especiales: letra del DNI sobre 7 dígitos
    return ES_DNI_LETTERS[Number(n.slice(1, 8)) % 23] === last
  }
  if ('ABCDEFGHJNPQRSUVW'.includes(first)) { // CIF
    let sum = 0
    for (let i = 0; i < 7; i++) {
      let v = digit(n, 1 + i)
      if (i % 2 === 0) { v *= 2; v = Math.floor(v / 10) + v % 10 }
      sum += v
    }
    const c = (10 - sum % 10) % 10
    // Se aceptan letra o dígito de control (como stdnum y el API).
    return last === String(c) || last === 'JABCDEFGHI'[c]
  }
  return false
}

function isValidMxRfc(n) {
  let date
  if (n.length === 13) {
    if (!/^[A-Z&Ñ]{4}\d{6}[0-9A-Z]{3}$/.test(n)) return false
    date = n.slice(4, 10)
  } else if (n.length === 12) {
    if (!/^[A-Z&Ñ]{3}\d{6}[0-9A-Z]{3}$/.test(n)) return false
    date = n.slice(3, 9)
  } else {
    return false
  }
  if (MX_GENERIC.has(n) || !validYyMmDd(date)) return false
  if (!MX_ENFORCE_CHECK_DIGIT) return true
  const base = ('   ' + n.slice(0, -1)).slice(-12)
  let sum = 0
  for (let i = 0; i < 12; i++) sum += MX_ALPHABET.indexOf(base[i]) * (13 - i)
  return MX_ALPHABET[floorMod(11 - sum, 11)] === n[n.length - 1]
}

function isValidVeRif(n) {
  if (!/^[VEJPG]\d{9}$/.test(n)) return false
  let sum = 4 * ('VEJPG'.indexOf(n[0]) + 1)
  for (let i = 0; i < 8; i++) sum += digit(n, 1 + i) * VE_WEIGHTS[i]
  return '00987654321'[sum % 11] === n[9]
}

function isValidGtNit(n) {
  if (/^\d{13}$/.test(n)) return true // CUI usado como NIT (solo formato)
  if (!/^\d{1,11}[0-9K]$/.test(n)) return false
  const body = n.slice(0, -1)
  let sum = 0
  for (let i = 0; i < body.length; i++) sum += digit(body, body.length - 1 - i) * (i + 2)
  const c = floorMod(-sum, 11)
  const dv = c === 10 ? 'K' : String(c)
  return dv === n[n.length - 1]
}

function isValidPyRuc(n) {
  if (!/^\d{5,9}$/.test(n)) return false
  const body = n.slice(0, -1)
  let sum = 0
  for (let i = 0; i < body.length; i++) sum += digit(body, body.length - 1 - i) * (i + 2)
  return floorMod(-sum, 11) % 10 === digit(n, n.length - 1)
}

function isValidDoRnc(n) {
  if (DO_RNC_WHITELIST.has(n)) return true
  if (/^\d{11}$/.test(n)) return true // cédula de persona física (solo formato)
  if (!/^\d{9}$/.test(n)) return false
  const r = weighted(n, DO_WEIGHTS) % 11
  return floorMod(10 - r, 9) + 1 === digit(n, 8)
}

function isValidSvNit(n) {
  if (/^\d{9}$/.test(n)) return true // DUI homologado como NIT (solo formato)
  if (!/^[019]\d{13}$/.test(n)) return false
  let sum = 0
  let dv
  if (n.slice(10, 13) <= '100') { // NIT viejo
    for (let i = 0; i < 13; i++) sum += digit(n, i) * (14 - i)
    dv = (sum % 11) % 10
  } else { // NIT nuevo
    const w = [2, 7, 6, 5, 4, 3, 2, 7, 6, 5, 4, 3, 2]
    for (let i = 0; i < 13; i++) sum += digit(n, i) * w[i]
    dv = floorMod(-sum, 11) % 10
  }
  return dv === digit(n, 13)
}

// ── helpers ───────────────────────────────────────────────────────────────

function cc(countryCode) {
  return countryCode == null ? '' : String(countryCode).trim().toUpperCase()
}

function digit(s, i) { return s.charCodeAt(i) - 48 }

function weighted(s, weights) {
  let sum = 0
  for (let i = 0; i < weights.length; i++) sum += digit(s, i) * weights[i]
  return sum
}

/** Math.floorMod de Java (el % de JS conserva el signo del dividendo). */
function floorMod(a, m) { return ((a % m) + m) % m }

function validYyMmDd(d) {
  const mm = Number(d.slice(2, 4))
  const dd = Number(d.slice(4, 6))
  if (mm < 1 || mm > 12 || dd < 1) return false
  const yy = Number(d.slice(0, 2))
  return dd <= new Date(Date.UTC(2000 + yy, mm, 0)).getUTCDate()
}
