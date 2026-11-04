#!/usr/bin/env node
/**
 * Datos de ejemplo de COMPRAS Y GASTOS para una cuenta de prueba (Frank, 4-nov-2026: «que le agregues datos
 * para poderlo ver y analizar mejor»). Entra por el API como el dueño y crea, sobre su negocio actual:
 *  - 3 proveedores (si no existen), 6 productos (si hay menos de 6),
 *  - ~18 recepciones repartidas en los últimos 90 días, al contado y al crédito, con costos reales,
 *  - ~24 gastos de todos los tipos y medios de pago.
 * Solo toca la cuenta que le pases. NO crea cuentas. Es idempotente a medias: los proveedores y productos se
 * reutilizan por nombre; las recepciones y gastos se vuelven a crear cada vez (córrelo una sola vez).
 *
 * Uso:  API=https://api.eazy-stock.com EMAIL=eazyuser123@gmail.com PASSWORD='…' node tools/seed-demo-purchases.mjs
 *       (local: API=http://127.0.0.1:19393 EMAIL=will@local.test PASSWORD=admin123)
 */
const API = process.env.API ?? 'http://127.0.0.1:19393'
const EMAIL = process.env.EMAIL
const PASSWORD = process.env.PASSWORD
if (!EMAIL || !PASSWORD) { console.error('Falta EMAIL o PASSWORD'); process.exit(1) }

let token = null
async function call(method, path, body) {
  const r = await fetch(API + path, {
    method, headers: { 'Content-Type': 'application/json', Origin: 'http://localhost:5173', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  })
  const j = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(`${method} ${path} → ${r.status} ${j.message ?? JSON.stringify(j)}`)
  return j.data ?? j
}
const rnd = (a, b) => Math.round((a + Math.random() * (b - a)) * 100) / 100
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)]
const daysAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10) }

const login = await call('POST', '/api/auth/login', { email: EMAIL, password: PASSWORD })
token = login.token ?? login.accessToken ?? login.data?.token
if (!token) throw new Error('Login sin token: ' + JSON.stringify(login).slice(0, 200))
const me = await call('GET', '/api/auth/me')
console.log(`→ ${me.name} · negocio ${me.businessName} (${me.currency})`)

// Proveedores
const wantSuppliers = ['Distribuidora Andina', 'Ferretería Mayorista Lima', 'Importaciones El Sol']
const existing = (await call('GET', '/api/suppliers?size=200')).content ?? []
const suppliers = []
for (const name of wantSuppliers) {
  let s = existing.find((x) => x.name.toLowerCase() === name.toLowerCase())
  if (!s) s = await call('POST', '/api/suppliers', { name, contact: 'Ventas', phone: '+51 999 000 ' + String(100 + suppliers.length) })
  suppliers.push(s)
}
console.log(`→ proveedores: ${suppliers.map((s) => s.name).join(', ')}`)

// Productos
const wantProducts = [
  { name: 'Cemento Sol 42.5 kg', unit: 'unidad', purchasePrice: 28.5, salePrice: 33.9, attributes: { Peso: '42.5', Material: 'Otro' } },
  { name: 'Clavo de acero 2"', unit: 'kilo', purchasePrice: 5.2, salePrice: 7.5, attributes: { Largo: '5', Material: 'Acero' } },
  { name: 'Pintura látex blanco 4 L', unit: 'unidad', purchasePrice: 38, salePrice: 52, attributes: { Capacidad: '4', Color: 'Blanco' } },
  { name: 'Cinta aislante negra', unit: 'unidad', purchasePrice: 1.8, salePrice: 3, attributes: { Color: 'Negro', Largo: '1000' } },
  { name: 'Tubo PVC 1/2" x 3 m', unit: 'unidad', purchasePrice: 6.4, salePrice: 9.5, attributes: { Largo: '300', Material: 'Plástico' } },
  { name: 'Canasta artesanal de mimbre', unit: 'unidad', purchasePrice: 15, salePrice: 29, attributes: { Artesanal: 'Sí', Material: 'Madera', Alto: '25' } },
]
const existingProducts = (await call('GET', '/api/products?size=200')).content ?? []
const products = []
for (const [i, p] of wantProducts.entries()) {
  let found = existingProducts.find((x) => x.name.toLowerCase() === p.name.toLowerCase())
  if (!found) found = await call('POST', '/api/products', { ...p, supplierId: suppliers[i % suppliers.length].id, minStock: 5, allowDuplicateName: true })
  products.push(found)
}
console.log(`→ productos: ${products.length}`)

// Recepciones: el API las fecha HOY (no acepta fecha), así que caen en el mes en curso. ONLY=expenses las salta.
let receipts = 0
for (let k = 0; k < (process.env.ONLY === 'expenses' ? 0 : 18); k++) {
  const sup = pick(suppliers)
  const lines = Array.from({ length: 1 + Math.floor(Math.random() * 3) }, () => pick(products))
  const items = [...new Map(lines.map((p) => [p.id, p])).values()].map((p) => ({ productId: p.id, quantity: Math.ceil(rnd(5, 40)), unitCost: rnd(p.purchasePrice * 0.9, p.purchasePrice * 1.1) }))
  const totalAmount = Math.round(items.reduce((s, it) => s + it.quantity * it.unitCost, 0) * 100) / 100
  try {
    await call('POST', `/api/suppliers/${sup.id}/receipts`, { items, totalAmount, paymentMode: Math.random() < 0.35 ? 'CREDIT' : 'CASH', referenceDocument: `F001-${1000 + k}`, notes: 'Datos de ejemplo' })
    receipts++
  } catch (e) { console.warn('  recepción:', e.message) }
}
console.log(`→ recepciones creadas: ${receipts}`)

// Gastos (ONLY=receipts los salta)
const kinds = [
  ['RENT', 'Alquiler del local', 1200, 1200], ['UTILITIES', 'Luz del mes', 180, 260], ['UTILITIES', 'Internet y teléfono', 90, 120],
  ['TRANSPORT', 'Flete de mercadería', 40, 150], ['SALARIES', 'Sueldo quincena', 900, 1100], ['TAXES', 'Pago SUNAT', 150, 400],
  ['MAINTENANCE', 'Arreglo de la puerta', 60, 200], ['MARKETING', 'Volantes y redes', 50, 120], ['SUPPLIES', 'Bolsas y boletas', 25, 60], ['OTHER', 'Varios', 15, 80],
]
const methods = ['CASH', 'YAPE_PLIN', 'TRANSFER', 'CARD']
let expenses = 0
for (let k = 0; k < (process.env.ONLY === 'receipts' ? 0 : 24); k++) {
  const [category, concept, a, b] = pick(kinds)
  try {
    await call('POST', '/api/expenses', { day: daysAgo(Math.floor(Math.random() * 90)), amount: rnd(a, b), category, concept, paymentMethod: pick(methods),
      supplierId: category === 'TRANSPORT' ? pick(suppliers).id : null, notes: 'Dato de ejemplo' })
    expenses++
  } catch (e) { console.warn('  gasto:', e.message) }
}
console.log(`→ gastos creados: ${expenses}`)

// Clientes y VENTAS (Frank, 4-nov: «agrégale datos a la dashboard, que se vea activa»). ONLY=receipts|expenses las salta.
let sales = 0
if (!process.env.ONLY) {
  const wantCustomers = [['María Quispe', 300], ['Jorge Huamán', 500], ['Rosa Flores', 200], ['Constructora Andes SAC', 2000]]
  const existingCustomers = (await call('GET', '/api/customers?size=200')).content ?? []
  const customers = []
  for (const [name, creditLimit] of wantCustomers) {
    let c = existingCustomers.find((x) => x.name.toLowerCase() === name.toLowerCase())
    if (!c) c = await call('POST', '/api/customers', { name, creditLimit, phone: '+51 9' + String(10000000 + Math.floor(Math.random() * 89999999)) })
    customers.push(c)
  }
  let methods = []
  try { const m = await call('GET', '/api/payment-methods'); methods = (m.content ?? m ?? []).filter((x) => x.active !== false) } catch { methods = [] }
  const fresh = (await call('GET', '/api/products?size=200&active=true')).content ?? []
  const sellable = fresh.filter((p) => Number(p.currentStock) > 3 && !p.priceIsVariable)
  for (let k = 0; k < 36 && sellable.length; k++) {
    const lines = [...new Map(Array.from({ length: 1 + Math.floor(Math.random() * 3) }, () => pick(sellable)).map((p) => [p.id, p])).values()]
    const items = lines.map((p) => ({ productId: p.id, quantity: 1 + Math.floor(Math.random() * 3) }))
    const credit = Math.random() < 0.25
    const customer = credit || Math.random() < 0.3 ? pick(customers) : null
    const method = methods.length ? pick(methods) : null
    try {
      await call('POST', '/api/sales', { items, isOnCredit: credit, customerId: customer?.id ?? null, paymentMethodId: credit ? null : method?.id ?? null, notes: 'Venta de ejemplo' })
      sales++
      for (const it of items) { const p = sellable.find((x) => x.id === it.productId); if (p) p.currentStock = Number(p.currentStock) - it.quantity }
    } catch (e) { console.warn('  venta:', e.message) }
  }
  console.log(`→ clientes: ${customers.length} · ventas creadas: ${sales}`)
}
console.log('Listo: abre Reportes › Compras y gastos con «Últimos 3 meses».')
