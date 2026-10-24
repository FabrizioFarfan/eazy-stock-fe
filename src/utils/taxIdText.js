// Textos del documento fiscal para la UI (traducidos con t()). Las reglas y los
// mensajes del API, sin traducir, viven en ./taxIds.js (espejo de TaxIds.java).
import { getDefaultCountry } from './phone'
import { t } from '../i18n'
import { docName, invalidHint, isFeminineDoc, labelFor, normalize, isValidFor } from './taxIds'

/** Cómo se llama el identificador fiscal en cada país (etiqueta del formulario). */
export const TAX_ID_LABEL = {
  PE: 'RUC', EC: 'RUC', AR: 'CUIT', CL: 'RUT', CO: 'NIT', BO: 'NIT', MX: 'RFC', UY: 'RUT', PY: 'RUC', ES: 'NIF',
  // Resto de LatAm (multi-país, 24-oct-2026)
  VE: 'RIF', DO: 'RNC', PA: 'RUC', NI: 'RUC', GT: 'NIT', SV: 'NIT', HN: 'RTN', CR: 'Cédula jurídica', CU: 'NIT',
  IT: 'Partita IVA', DE: 'USt-IdNr.',
}

/**
 * Etiqueta del documento fiscal en el país del negocio (RUC, NIF, NIT…) — para
 * proveedores, PDFs y formularios. Sin etiqueta conocida: «Identificación fiscal».
 */
export function taxIdLabel(country = getDefaultCountry()) {
  return TAX_ID_LABEL[country] ?? (labelFor(country) !== 'TAX_ID' ? labelFor(country) : t('Identificación fiscal'))
}

/** El tipo guardado en el negocio; el genérico «TAX_ID» del BE se muestra con la etiqueta del país. */
export function displayTaxIdType(type, country = getDefaultCountry()) {
  const s = (type ?? '').trim()
  if (s === 'CEDULA_JURIDICA') return t('Cédula jurídica')
  return !s || s === 'TAX_ID' ? taxIdLabel(country) : s
}

/**
 * «RUC», «NIF», «cédula jurídica», «número de identificación fiscal». Las siglas no se
 * traducen (la llave «RUC» de proveedores dice «Tax ID» en inglés); las dos frases sí.
 */
export function taxIdDocName(country) {
  const name = docName(country)
  return /\s/.test(name) ? t(name) : name
}

/** Longitud fija del documento (para el texto del campo), o null si varía. */
const FIXED_DIGITS = { PE: 11, AR: 11, EC: 13, UY: 12, HN: 14 }

/** Texto bajo el campo: «El RUC de tu negocio (11 dígitos). Lo usamos para identificar tu empresa.» */
export function taxIdHelp(country) {
  const doc = taxIdDocName(country)
  const n = FIXED_DIGITS[country]
  if (isFeminineDoc(country)) return t('La {doc} de tu negocio. La usamos para identificar tu empresa.', { doc })
  return n
    ? t('El {doc} de tu negocio ({n} dígitos). Lo usamos para identificar tu empresa.', { doc, n })
    : t('El {doc} de tu negocio. Lo usamos para identificar tu empresa.', { doc })
}

/** «Este RUC no es válido: son 11 dígitos…» — el mismo mensaje que el 400 del API, traducido. */
export function taxIdInvalidMessage(country) {
  const doc = taxIdDocName(country)
  const hint = t(invalidHint(country))
  return isFeminineDoc(country)
    ? t('Esta {doc} no es válida: {hint}', { doc, hint })
    : t('Este {doc} no es válido: {hint}', { doc, hint })
}

/**
 * 409 TAX_ID_ALREADY_REGISTERED: «Este RUC ya tiene una cuenta en Eazy Stock. Si es tuyo, inicia
 * sesión o escríbenos.», traducido (el API lo manda en español).
 */
export function taxIdAlreadyRegisteredMessage(country) {
  const doc = taxIdDocName(country)
  return isFeminineDoc(country)
    ? t('Esta {doc} ya tiene una cuenta en Eazy Stock. Si es tuya, inicia sesión o escríbenos.', { doc })
    : t('Este {doc} ya tiene una cuenta en Eazy Stock. Si es tuyo, inicia sesión o escríbenos.', { doc })
}

/** Registro con un documento que ya usó su prueba (AuthResponse.setupPending, API 1.15.0). */
export function taxIdTrialUsedMessage(country) {
  const doc = taxIdDocName(country)
  return isFeminineDoc(country)
    ? t('Esta {doc} ya usó su periodo gratis. Elige tu plan para continuar.', { doc })
    : t('Este {doc} ya usó su periodo gratis. Elige tu plan para continuar.', { doc })
}

/**
 * Valida en el cliente con el algoritmo del país (como el API): null si está bien,
 * si no, el mensaje. Vacío → `requiredMessage` (o null si es opcional).
 */
export function checkTaxId(country, raw, { requiredMessage } = {}) {
  const n = normalize(raw)
  if (n == null) return requiredMessage ?? null
  return isValidFor(country, n) ? null : taxIdInvalidMessage(country)
}

/** Con quién se verifica el documento en cada país (Ajustes › Mi negocio). */
export const TAX_REGISTRY = {
  PE: 'SUNAT', AR: 'ARCA', CL: 'SII', CO: 'DIAN', EC: 'SRI', MX: 'SAT', ES: 'AEAT', UY: 'DGI', PY: 'DNIT',
  VE: 'SENIAT', GT: 'SAT', DO: 'DGII', SV: 'Hacienda', BO: 'SIN', CR: 'Hacienda', PA: 'DGI', HN: 'SAR', NI: 'DGI',
}
