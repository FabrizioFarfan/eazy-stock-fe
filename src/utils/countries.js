// Países que ofrecemos al crear o editar un negocio (Ajustes › Mi negocio y /registro).
// Latinoamérica primero; Europa (Frank, sep-2026): los mercados donde ya hay clientes o contactos.
export const COUNTRIES = [
  ['PE', 'Perú'], ['AR', 'Argentina'], ['BO', 'Bolivia'], ['BR', 'Brasil'],
  ['CL', 'Chile'], ['CO', 'Colombia'], ['EC', 'Ecuador'], ['MX', 'México'],
  ['PY', 'Paraguay'], ['UY', 'Uruguay'], ['VE', 'Venezuela'],
  // Resto de LatAm (multi-país, 24-oct-2026)
  ['CR', 'Costa Rica'], ['DO', 'Rep. Dominicana'], ['SV', 'El Salvador'], ['GT', 'Guatemala'],
  ['HN', 'Honduras'], ['NI', 'Nicaragua'], ['PA', 'Panamá'],
  ['US', 'Estados Unidos'],
  ['ES', 'España'], ['IT', 'Italia'], ['PL', 'Polonia'], ['DE', 'Alemania'], ['FR', 'Francia'], ['PT', 'Portugal'],
]

export const COUNTRY_NAME = Object.fromEntries(COUNTRIES)

// ── Multi-país (LatAm + España, 24-oct-2026) ─────────────────────────────────
// La fuente de verdad es el API (GET /api/countries ← util/CountryConfig.java).
// Esto es solo el respaldo del registro si el API no responde: mismos campos y
// mismas reglas del contrato (COUNTRY-SPEC.md): base Efectivo/Tarjeta/Transferencia
// + extras por país; CLP, COP y PYG sin decimales; fecha dd/MM/yyyy en todos.
const BASE_METHODS = ['Efectivo', 'Tarjeta', 'Transferencia']
const EXTRA_METHODS = { PE: ['Yape', 'Plin'], CO: ['Nequi', 'Daviplata'], MX: ['Mercado Pago'], AR: ['Mercado Pago'], ES: ['Bizum'] }
const cfg = (code, name, currency, currencySymbol, decimals, dialCode, locale) => ({
  code, name, currency, currencySymbol, decimals, dialCode, dateFormat: 'dd/MM/yyyy', locale,
  defaultPaymentMethods: [...BASE_METHODS, ...(EXTRA_METHODS[code] ?? ['Billetera digital'])],
})
export const FALLBACK_COUNTRY_CONFIGS = [
  cfg('PE', 'Perú',            'PEN', 'S/',  2, '51',  'es-PE'),
  cfg('AR', 'Argentina',       'ARS', '$',   2, '54',  'es-AR'),
  cfg('BO', 'Bolivia',         'BOB', 'Bs',  2, '591', 'es-BO'),
  cfg('BR', 'Brasil',          'BRL', 'R$',  2, '55',  'pt-BR'),
  cfg('CL', 'Chile',           'CLP', '$',   0, '56',  'es-CL'),
  cfg('CO', 'Colombia',        'COP', '$',   0, '57',  'es-CO'),
  cfg('CR', 'Costa Rica',      'CRC', '₡',   2, '506', 'es-CR'),
  cfg('DO', 'República Dominicana', 'DOP', 'RD$', 2, '1', 'es-DO'),
  cfg('EC', 'Ecuador',         'USD', '$',   2, '593', 'es-EC'),
  cfg('SV', 'El Salvador',     'USD', '$',   2, '503', 'es-SV'),
  cfg('GT', 'Guatemala',       'GTQ', 'Q',   2, '502', 'es-GT'),
  cfg('HN', 'Honduras',        'HNL', 'L',   2, '504', 'es-HN'),
  cfg('MX', 'México',          'MXN', '$',   2, '52',  'es-MX'),
  cfg('NI', 'Nicaragua',       'NIO', 'C$',  2, '505', 'es-NI'),
  cfg('PA', 'Panamá',          'PAB', 'B/.', 2, '507', 'es-PA'),
  cfg('PY', 'Paraguay',        'PYG', '₲',   0, '595', 'es-PY'),
  cfg('UY', 'Uruguay',         'UYU', '$',   2, '598', 'es-UY'),
  cfg('VE', 'Venezuela',       'VES', 'Bs.', 2, '58',  'es-VE'),
  cfg('ES', 'España',          'EUR', '€',   2, '34',  'es-ES'),
]

/**
 * País que se propone en el registro según el navegador (`navigator.languages`):
 * la primera región soportada (es-CO → CO, es-ES → ES); sin región o no soportada → PE.
 */
export function suggestedCountry(regions, supportedCodes) {
  const ok = new Set(supportedCodes)
  return regions.find((r) => ok.has(r)) ?? 'PE'
}
