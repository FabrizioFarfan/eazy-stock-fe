import test from 'node:test'
import assert from 'node:assert/strict'
import { supplierChanges, allAnswered, adoptFields } from './supplierChanges.js'

const hetesur = { id: 's-new', name: 'Hetesur' }
const lines = [
  { id: 'p1', name: 'Spray negro', supplierId: 's-old', supplierName: 'AQPCcompany' },
  { id: 'p2', name: 'Martillo', supplierId: 's-new', supplierName: 'Hetesur' },
  { id: 'p3', name: 'Sin proveedor', supplierId: null, supplierName: null },
]

test('solo salen los productos que eran de otro proveedor', () => {
  assert.deepEqual(supplierChanges(lines, hetesur), [
    { id: 'p1', name: 'Spray negro', oldSupplier: 'AQPCcompany', newSupplier: 'Hetesur', unassigned: false },
  ])
})

test('sin proveedor elegido o todos del mismo: nada que preguntar', () => {
  assert.deepEqual(supplierChanges(lines, null), [])
  assert.deepEqual(supplierChanges([lines[1]], hetesur), [])
})

test('un producto repetido se pregunta una vez', () => {
  assert.equal(supplierChanges([lines[0], lines[0]], hetesur).length, 1)
})

test('hay que responder por todos antes de guardar', () => {
  const changes = supplierChanges([lines[0], { ...lines[0], id: 'p4' }], hetesur)
  assert.equal(allAnswered(changes, {}), false)
  assert.equal(allAnswered(changes, { p1: true }), false)
  assert.equal(allAnswered(changes, { p1: true, p4: false }), true)
})

test('al API solo viaja adoptSupplier cuando eligió «desde ahora»', () => {
  assert.deepEqual(adoptFields({ p1: true }, 'p1'), { adoptSupplier: true })
  assert.deepEqual(adoptFields({ p1: false }, 'p1'), {})
  assert.deepEqual(adoptFields({}, 'p1'), {})
  assert.deepEqual(adoptFields(undefined, 'p1'), {})
})

test('el proveedor de relleno de la importación se marca como «sin proveedor»', () => {
  const [c] = supplierChanges([{ id: 'p9', name: 'Clavo', supplierId: 's-x', supplierName: 'Sin proveedor asignado' }], hetesur)
  assert.equal(c.unassigned, true)
})
