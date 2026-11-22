import test from 'node:test'
import assert from 'node:assert/strict'
import { toReceiptRows, receiptSummary, newProductBody, buildReceiptDraft } from './receiptPhoto.js'

const cemento = { id: 'p1', name: 'Cemento Sol 42.5 kg', purchasePrice: 27 }
const clavo2 = { id: 'p2', name: 'Clavo 2 pulgadas', purchasePrice: 5 }
const clavo3 = { id: 'p3', name: 'Clavo 3 pulgadas', purchasePrice: 6 }
const lines = [
  { ref: 1, name: 'CEM SOL 42.5KG', code: null, quantity: 10, unit: 'unidad', unitCost: 28.5, confidence: 'HIGH', photo: 1, match: cemento, candidates: [] },
  { ref: 2, name: 'CLAVO', code: null, quantity: null, unit: 'kilo', unitCost: null, confidence: 'LOW', photo: 1, match: null, candidates: [clavo2, clavo3] },
  { ref: 3, name: 'Thinner acrílico galón', code: 'TH-1', quantity: 2, unit: 'caja', unitCost: 29.5, confidence: 'MEDIUM', photo: 2, match: null, candidates: [] },
]

test('líneas leídas → filas: reconocida, por elegir y nueva', () => {
  const rows = toReceiptRows(lines)
  assert.deepEqual(rows.map((r) => r.mode), ['match', 'pick', 'new'])
  assert.equal(rows[0].product.id, 'p1')
  assert.deepEqual([rows[0].qty, rows[0].cost], ['10', '28.5'])
  // la reconocida también se ofrece entre las opciones al pulsar «Cambiar»
  assert.deepEqual(rows[0].candidates.map((c) => c.id), ['p1'])
  assert.deepEqual(rows[1].candidates.map((c) => c.id), ['p2', 'p3'])
  assert.deepEqual([rows[1].qty, rows[1].cost, rows[1].unit], ['', '', 'kilo'])
  // una unidad que no existe pasa a «unidad»; el nombre del nuevo arranca con lo leído
  assert.deepEqual([rows[2].unit, rows[2].newName, rows[2].code], ['unidad', 'Thinner acrílico galón', 'TH-1'])
  assert.deepEqual(toReceiptRows(undefined), [])
})

test('resumen: no se sigue sin decir cuál es, sin cantidad o con números mal escritos', () => {
  const rows = toReceiptRows(lines)
  let s = receiptSummary(rows)
  assert.deepEqual(s.problems, { 2: 'PICK' })
  assert.equal(s.ok, false)
  assert.deepEqual([s.lines, s.toCreate, s.total], [3, 1, 344])
  // se elige el clavo de 2, pero falta la cantidad
  rows[1] = { ...rows[1], mode: 'match', product: clavo2 }
  assert.deepEqual(receiptSummary(rows).problems, { 2: 'QTY' })
  rows[1] = { ...rows[1], qty: '3,5', cost: 'abc' }
  assert.deepEqual(receiptSummary(rows).problems, { 2: 'COST' })
  // el costo puede ir vacío: se pone después en la recepción
  rows[1] = { ...rows[1], cost: '' }
  s = receiptSummary(rows)
  assert.equal(s.ok, true)
  assert.equal(s.total, 344)
  // saltar una línea la saca de la cuenta
  rows[2] = { ...rows[2], mode: 'skip' }
  assert.deepEqual([receiptSummary(rows).lines, receiptSummary(rows).toCreate, receiptSummary(rows).total], [2, 0, 285])
  // todo saltado: no hay nada que pasar
  assert.equal(receiptSummary(rows.map((r) => ({ ...r, mode: 'skip' }))).ok, false)
})

test('nuevos: hace falta nombre y no pueden repetirse', () => {
  const row = toReceiptRows([lines[2]])[0]
  assert.deepEqual(receiptSummary([{ ...row, newName: '   ' }]).problems, { 3: 'NAME' })
  assert.deepEqual(receiptSummary([row, { ...row, key: 9, newName: 'thinner  ACRÍLICO galón' }]).problems, { 9: 'DUPLICATE' })
  assert.deepEqual(newProductBody({ ...row, newName: '  Thinner   acrílico 1 gal ' }, 's1'), {
    name: 'Thinner acrílico 1 gal', unit: 'unidad', providerCode: 'TH-1', supplierId: 's1',
    purchasePrice: 29.5, salePrice: 0, priceIsVariable: true,
  })
  assert.equal(newProductBody({ ...row, cost: '', code: '' }, 's1').purchasePrice, 0)
  assert.equal(newProductBody({ ...row, cost: '', code: '' }, 's1').providerCode, undefined)
})

test('borrador de la recepción: líneas, total del documento y el mismo producto dos veces', () => {
  const rows = toReceiptRows(lines)
  rows[1] = { ...rows[1], mode: 'match', product: clavo2, qty: '4', cost: '' }
  rows[2] = { ...rows[2], mode: 'skip' }
  const supplier = { id: 's1', name: 'Adelta' }
  const draft = buildReceiptDraft({ supplier, rows, productOf: (r) => r.product, referenceDocument: ' F001-482 ', documentTotal: 305 })
  assert.deepEqual(draft.items.map((i) => [i.product.id, i.quantity, i.unitCost]), [['p1', 10, 28.5], ['p2', 4, 5]])
  // sin costo leído, queda el que ya tenía el producto
  assert.deepEqual([draft.totalAmount, draft.totalTouched, draft.referenceDocument, draft.supplier.id], [305, false, 'F001-482', 's1'])
  // el documento dice otro total (impuestos): se respeta y se marca para que la recepción enseñe la diferencia
  const taxed = buildReceiptDraft({ supplier, rows, productOf: (r) => r.product, referenceDocument: '', documentTotal: 359.9 })
  assert.deepEqual([taxed.totalAmount, taxed.totalTouched], [359.9, true])
  // sin total en el documento: la suma de las líneas
  assert.deepEqual([buildReceiptDraft({ supplier, rows, productOf: (r) => r.product }).totalAmount], [305])
  // el mismo producto en dos líneas se junta, con el costo promedio
  const twice = [rows[0], { ...rows[0], key: 7, qty: '10', cost: '30.5' }]
  const merged = buildReceiptDraft({ supplier, rows: twice, productOf: (r) => r.product })
  assert.deepEqual(merged.items.map((i) => [i.quantity, i.unitCost]), [[20, 29.5]])
})
