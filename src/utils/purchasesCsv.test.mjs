import test from 'node:test'
import assert from 'node:assert/strict'
import { buildPurchasesCsv, projectMonth } from './purchasesCsv.js'

const labels = { tramo: 'Tramo', mercaderia: 'Mercadería', otros: 'Otros', total: 'Total', fecha: 'Fecha', proveedor: 'Proveedor', documento: 'Doc', pago: 'Pago', monto: 'Monto', concepto: 'Concepto', tipo: 'Tipo', producto: 'Producto', cantidad: 'Cantidad' }

test('el CSV lleva tramos, productos, recepciones y gastos, con punto y coma y comillas donde hace falta', () => {
  const csv = buildPurchasesCsv({
    report: { buckets: [{ key: '2026-11-01', purchased: 10, expenses: 2.5, total: 12.5 }], totalPurchased: 10, totalExpenses: 2.5, total: 12.5, byProduct: [{ name: 'Clavo 2"', quantity: 3, amount: 9 }] },
    receipts: [{ createdAt: '2026-11-01T10:00:00', supplierName: 'Aceros; SA', referenceDocument: 'F001-1', paymentMode: 'CASH', totalAmount: 10 }],
    expenses: [{ day: '2026-11-02', concept: 'Luz', category: 'UTILITIES', supplierName: null, paymentMethod: 'CASH', amount: 2.5 }],
    labels,
  })
  const lines = csv.replace('﻿', '').split('\n')
  assert.equal(lines[0], 'Tramo;Mercadería;Otros;Total')
  assert.equal(lines[1], '2026-11-01;10.00;2.50;12.50')
  assert.ok(lines.includes('"Clavo 2""";3.00;9.00'))
  assert.ok(lines.includes('2026-11-01;"Aceros; SA";F001-1;CASH;10.00'))
  assert.ok(lines.includes('2026-11-02;Luz;UTILITIES;;CASH;2.50'))
})

test('la proyección solo aplica al mes en curso y hasta hoy', () => {
  const today = new Date(2026, 10, 10) // 10-nov-2026
  const p = projectMonth({ from: '2026-11-01', to: '2026-11-10', total: 500, today })
  assert.equal(p.days, 30)
  assert.equal(Math.round(p.projected), 1500)
  assert.equal(projectMonth({ from: '2026-10-01', to: '2026-10-31', total: 500, today }), null)
  assert.equal(projectMonth({ from: '2026-11-01', to: '2026-11-30', total: 500, today: new Date(2026, 10, 30) }), null)
})
