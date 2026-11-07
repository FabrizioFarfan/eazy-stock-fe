// Parámetros de producto (Frank, 4-nov-2026): la lógica pura, sin React, para poder probarla.
// El valor de un producto vive en product.attributes[<nombre del parámetro>] (texto); el filtro viaja al
// API como pf[<id>]=valor (igualdad / contiene) y pfMin[<id>] / pfMax[<id>] (rango).

export const PARAMETER_TYPES = ['YES_NO', 'OPTIONS', 'NUMBER', 'TEXT']

export const TYPE_META = {
  YES_NO:  { label: 'Sí / No',           hint: 'Una casilla: ¿es artesanal? ¿tiene borrador?',       emoji: '✅' },
  OPTIONS: { label: 'Opciones',          hint: 'Una lista cerrada: rojo, azul, verde…',               emoji: '🎨' },
  NUMBER:  { label: 'Número con medida', hint: 'Largo en cm, capacidad en litros, peso en kg…',      emoji: '📏' },
  TEXT:    { label: 'Texto',             hint: 'Lo que sea, se busca por «contiene»: modelo, talla…', emoji: '✏️' },
}

/** Medidas de un toque para los parámetros numéricos. */
export const UNIT_PRESETS = ['cm', 'mm', 'm', 'pulg', 'L', 'ml', 'kg', 'g', 'W', 'V', 'u']

export const YES = 'Sí'
export const NO = 'No'

/** Busca la clave del mapa de atributos que corresponde a un parámetro (sin distinguir mayúsculas ni espacios). */
export function attrKeyFor(attributes, name) {
  const k = norm(name)
  return Object.keys(attributes ?? {}).find((a) => norm(a) === k) ?? null
}

export function attrValueFor(attributes, name) {
  const key = attrKeyFor(attributes, name)
  return key == null ? '' : String(attributes[key] ?? '')
}

/** Escribe el valor de un parámetro en el mapa (vacío = lo quita). Devuelve un mapa nuevo con la clave del parámetro. */
export function withParamValue(attributes, name, value) {
  const next = { ...(attributes ?? {}) }
  const existing = attrKeyFor(next, name)
  if (existing != null && existing !== name) delete next[existing]
  const v = value == null ? '' : String(value).trim()
  if (v === '') delete next[name]
  else next[name] = v
  return next
}

/** Las claves del mapa que NO son de ningún parámetro (atributos libres de antes). */
export function freeAttributeKeys(attributes, parameters) {
  const names = new Set((parameters ?? []).map((p) => norm(p.name)))
  return Object.keys(attributes ?? {}).filter((k) => !names.has(norm(k)))
}

/** «sí», «si», «yes», «true», «1» → Sí; «no», «false», «0» → No; lo demás → ''. */
export function normalizeYesNo(raw) {
  const v = String(raw ?? '').trim().toLowerCase()
  if (['sí', 'si', 'yes', 'true', '1', 'x', '✓'].includes(v)) return YES
  if (['no', 'false', '0'].includes(v)) return NO
  return ''
}

/** Estado del filtro: { [id]: { value, min, max } }. Solo entra al query lo que tiene algo. */
export function emptyParamFilters() { return {} }

export function paramFiltersToQuery(filters) {
  const pf = {}, pfMin = {}, pfMax = {}
  for (const [id, f] of Object.entries(filters ?? {})) {
    if (!f) continue
    const value = String(f.value ?? '').trim()
    const min = String(f.min ?? '').trim()
    const max = String(f.max ?? '').trim()
    if (value) pf[id] = value
    if (min) pfMin[id] = min
    if (max) pfMax[id] = max
  }
  const out = {}
  if (Object.keys(pf).length) out.pf = pf
  if (Object.keys(pfMin).length) out.pfMin = pfMin
  if (Object.keys(pfMax).length) out.pfMax = pfMax
  return out
}

export function countActiveParamFilters(filters) {
  return Object.keys(paramFiltersToQuery(filters).pf ?? {}).length
    + new Set([...Object.keys(paramFiltersToQuery(filters).pfMin ?? {}), ...Object.keys(paramFiltersToQuery(filters).pfMax ?? {})]).size
}

/** Chips legibles del filtro activo: [{ id, label }]. */
export function paramFilterChips(filters, parameters) {
  const byId = new Map((parameters ?? []).map((p) => [p.id, p]))
  const chips = []
  for (const [id, f] of Object.entries(filters ?? {})) {
    const p = byId.get(id)
    if (!p || !f) continue
    const value = String(f.value ?? '').trim()
    const min = String(f.min ?? '').trim()
    const max = String(f.max ?? '').trim()
    const unit = p.unit ? ` ${p.unit}` : ''
    if (p.type === 'NUMBER') {
      if (min && max) chips.push({ id, label: `${p.name}: ${min}–${max}${unit}` })
      else if (min) chips.push({ id, label: `${p.name}: ≥ ${min}${unit}` })
      else if (max) chips.push({ id, label: `${p.name}: ≤ ${max}${unit}` })
    } else if (value) {
      chips.push({ id, label: `${p.name}: ${value}` })
    }
  }
  return chips
}

/** El texto de un valor para mostrar («25» + «cm» → «25 cm»). */
export function displayValue(parameter, raw) {
  const v = String(raw ?? '').trim()
  if (!v) return ''
  if (parameter?.type === 'NUMBER' && parameter.unit && !v.toLowerCase().endsWith(parameter.unit.toLowerCase())) return `${v} ${parameter.unit}`
  return v
}

function norm(s) { return String(s ?? '').trim().toLowerCase() }

/** Lo que cambió entre dos mapas de atributos, para mandar solo eso: { nombre: valor } y '' = quitado. */
export function attributesDelta(before, after) {
  const delta = {}
  for (const key of new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})])) {
    const was = attrValueFor(before, key)
    const now = attrValueFor(after, key)
    if (was !== now) delta[attrKeyFor(after, key) ?? attrKeyFor(before, key) ?? key] = now
  }
  return delta
}
