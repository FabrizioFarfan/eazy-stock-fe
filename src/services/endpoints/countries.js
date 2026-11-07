import api from '../api'

/**
 * Países soportados (multi-país, 24-oct-2026; público, sin sesión).
 * [{ code, name, currency, currencySymbol, decimals, dialCode, dateFormat, locale, defaultPaymentMethods }]
 */
export const countriesApi = {
  list: () => api.get('/countries'),
  get:  (code) => api.get(`/countries/${code}`),
  // País de quien pregunta, para proponerlo en el registro (la IP no se guarda): { country? }
  detect: () => api.get('/public/geo'),
}
