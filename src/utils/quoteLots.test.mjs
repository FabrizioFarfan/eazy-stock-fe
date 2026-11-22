import test from 'node:test'
import assert from 'node:assert/strict'
import { quoteLotOptions, quoteLotFields, quoteLotPatch, quoteLineKey, freeLotOptions, canAddLotLine, nameWithLot } from './quoteLots.js'
import { cartLineFromQuoteItem } from './saleUnits.js'

const agarre = { id: 'L1', parameters: { 'Agarre adherente': 'Sí' }, label: 'Agarre adherente: Sí', quantity: 5 }
const martillo = { id: 'p1', name: 'Martillo', currentStock: 12, looseStock: 7, lots: [agarre], attributes: { 'Agarre adherente': 'No' } }

test('grupos de una cotización: los cubos con etiqueta, solo si hay de dónde elegir', () => {
  assert.deepEqual(quoteLotOptions(martillo), [
    { lotId: null, label: 'Agarre adherente: No' },
    { lotId: 'L1', label: 'Agarre adherente: Sí' },
  ])
  // sin lotes no hay nada que elegir
  assert.deepEqual(quoteLotOptions({ id: 'p2', currentStock: 3 }), [])
  // todo el stock en un solo lote: tampoco
  assert.deepEqual(quoteLotOptions({ ...martillo, currentStock: 5, looseStock: 0 }), [])
  // lo suelto sin etiqueta no se ofrece: «sin lote» no le dice nada al cliente
  assert.deepEqual(quoteLotOptions({ ...martillo, attributes: {} }), [{ lotId: 'L1', label: 'Agarre adherente: Sí' }])
})

test('lo ya guardado se conserva aunque ese grupo ya no tenga stock', () => {
  const sinStock = { id: 'p1', currentStock: 7, looseStock: 7, lots: [] }
  const f = quoteLotFields(sinStock, 'L1', 'Agarre adherente: Sí')
  assert.deepEqual(f, { lotOptions: [{ lotId: 'L1', label: 'Agarre adherente: Sí' }], lotId: 'L1', lotLabel: 'Agarre adherente: Sí' })
  assert.deepEqual(quoteLotFields(martillo), { lotOptions: quoteLotOptions(martillo), lotId: null, lotLabel: null })
  // el grupo de lo suelto se reconoce por su etiqueta
  assert.equal(quoteLotFields(martillo, null, 'Agarre adherente: No').lotLabel, 'Agarre adherente: No')
})

test('elegir grupo, quitarlo y añadir otra línea del mismo producto', () => {
  const line = { key: 'a', productId: 'p1', ...quoteLotFields(martillo) }
  assert.deepEqual(quoteLotPatch(line, 'Agarre adherente: Sí'), { lotId: 'L1', lotLabel: 'Agarre adherente: Sí' })
  assert.deepEqual(quoteLotPatch(line, 'Agarre adherente: No'), { lotId: null, lotLabel: 'Agarre adherente: No' })
  assert.deepEqual(quoteLotPatch(line, ''), { lotId: null, lotLabel: null })
  // sin decir cuál no se ofrece otra línea
  assert.equal(canAddLotLine([line], line), false)
  const con = { ...line, ...quoteLotPatch(line, 'Agarre adherente: Sí') }
  assert.equal(canAddLotLine([con], con), true)
  assert.deepEqual(freeLotOptions([con], con), [{ lotId: null, label: 'Agarre adherente: No' }])
  const sin = { ...line, key: 'b', ...quoteLotPatch(line, 'Agarre adherente: No') }
  assert.equal(canAddLotLine([con, sin], con), false)
  assert.equal(quoteLineKey(con), 'a')
  assert.equal(quoteLineKey({ productId: 'p9' }), 'p9')
})

test('el nombre que lee el cliente', () => {
  assert.equal(nameWithLot('Martillo', 'Agarre adherente: Sí'), 'Martillo (Agarre adherente: Sí)')
  assert.equal(nameWithLot('Martillo', null), 'Martillo')
})

test('cotización → venta: sale del mismo grupo, recortado a lo que queda en él', () => {
  const it = { productId: 'p1', productName: 'Martillo', unit: 'unidad', quantity: 6, unitPrice: 15, currentStock: 12, currentSalePrice: 15,
    lots: [agarre], looseStock: 7, productAttributes: { 'Agarre adherente': 'No' }, lotId: 'L1', lotLabel: 'Agarre adherente: Sí' }
  const line = cartLineFromQuoteItem(it)
  assert.deepEqual([line.lotId, line.quantity], ['L1', 5])
  assert.deepEqual(line.product.lots, [agarre])
  // lo suelto se reconoce por su etiqueta
  assert.deepEqual([cartLineFromQuoteItem({ ...it, lotId: null, lotLabel: 'Agarre adherente: No' }).lotId], [null])
  // sin grupo cotizado y con dos sitios de donde sacar: se pregunta al vender (undefined)
  assert.equal(cartLineFromQuoteItem({ ...it, lotId: null, lotLabel: null }).lotId, undefined)
  // el grupo cotizado ya no tiene stock: también se pregunta
  assert.equal(cartLineFromQuoteItem({ ...it, lotId: 'otro', lotLabel: 'Ya no' }).lotId, undefined)
  // producto sin lotes: como siempre
  const plain = cartLineFromQuoteItem({ productId: 'p2', productName: 'Cable', unit: 'metro', quantity: 3, unitPrice: 3, currentStock: 12, currentSalePrice: 3 })
  assert.equal(plain.lotId, null)
})
