// El grupo (lote) en una cotización (tarea 2237): una cotización de martillos tiene que decir si son con agarre o sin.
// Lógica pura, con tests. Una cotización no gasta stock: el grupo es opcional y es, sobre todo, lo que lee el cliente.
import { lotBuckets } from './lots.js'

/**
 * Los grupos que se pueden nombrar: los cubos del producto que tienen etiqueta, y solo si hay de dónde elegir
 * (dos cubos o más). Lo ya guardado en la línea se conserva aunque ese grupo ya no tenga stock.
 */
export function quoteLotOptions(product, savedLotId = null, savedLabel = null) {
  const buckets = lotBuckets(product)
  const options = buckets.length >= 2 ? buckets.filter((b) => b.label).map((b) => ({ lotId: b.lotId, label: b.label })) : []
  if (savedLabel && !options.some((o) => o.label === savedLabel)) options.push({ lotId: savedLotId ?? null, label: savedLabel })
  return options
}

/** Los campos de grupo de una línea de cotización. */
export function quoteLotFields(product, savedLotId = null, savedLabel = null) {
  const lotOptions = quoteLotOptions(product, savedLotId, savedLabel)
  const picked = savedLabel ? lotOptions.find((o) => o.label === savedLabel) : null
  return { lotOptions, lotId: picked ? picked.lotId : null, lotLabel: picked ? picked.label : null }
}

/** Lo que cambia en la línea al elegir un grupo por su etiqueta ('' = no decir cuál). */
export function quoteLotPatch(line, label) {
  const picked = (line.lotOptions ?? []).find((o) => o.label === label)
  return picked ? { lotId: picked.lotId, lotLabel: picked.label } : { lotId: null, lotLabel: null }
}

/** Cada línea tiene su llave: el mismo producto puede ir en dos, una por grupo. Los borradores viejos no la traen. */
export const quoteLineKey = (line) => line.key ?? line.productId

/** Grupos del producto que aún no tienen línea en la cotización. */
export function freeLotOptions(items, line) {
  const used = new Set(items.filter((x) => x.productId === line.productId).map((x) => x.lotLabel).filter(Boolean))
  return (line.lotOptions ?? []).filter((o) => !used.has(o.label))
}

/** «＋ Otro grupo»: solo cuando esta línea ya dice cuál y queda otro grupo sin cotizar. */
export const canAddLotLine = (items, line) => Boolean(line.lotLabel) && freeLotOptions(items, line).length > 0

/** El nombre que lee el cliente en el PDF, la impresión y el resumen. */
export const nameWithLot = (name, lotLabel) => (lotLabel ? `${name} (${lotLabel})` : name)
