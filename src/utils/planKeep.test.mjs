// Bajar de plan (PLANS-SPEC.md): propuesta, validación y payload del modal «Elige qué queda activo».
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { isDowngrade, defaultKeep, keepPayload, validateKeep, toggleId, countedEmployees } from './planKeep.js'

const emp = (id, active = true, planDeactivated = false) => ({ id, name: id, email: `${id}@x.com`, active, planDeactivated })
const preview = {
  plan: 'BASIC', maxBusinesses: 1, maxEmployeesPerBusiness: 2, needsSelection: true,
  businesses: [
    { id: 'b1', name: 'Antigua', planLocked: true, employees: [emp('e1')] },
    { id: 'b2', name: 'Centro', planLocked: false, employees: [emp('e2', false, true), emp('e3'), emp('e4'), emp('e5', false, false)] },
    { id: 'b3', name: 'Norte', planLocked: false, employees: [] },
  ],
}

test('bajar de plan', () => {
  assert.equal(isDowngrade('PRO', 'BASIC'), true)
  assert.equal(isDowngrade('AI', 'PRO'), true)
  assert.equal(isDowngrade('BASIC', 'PRO'), false)
  assert.equal(isDowngrade('PRO', 'PRO'), false)
  assert.equal(isDowngrade(null, 'BASIC'), false)
  assert.equal(isDowngrade('pro', 'basic'), true)
})

test('los dados de baja a mano no cuentan', () => {
  assert.deepEqual(countedEmployees(preview.businesses[1]).map((e) => e.id), ['e2', 'e3', 'e4'])
})

test('propuesta: negocios no bloqueados primero; activos antes que los desactivados por el plan', () => {
  assert.deepEqual(defaultKeep(preview), { businessIds: ['b2'], employeeIds: ['e3', 'e4'] })
})

test('propuesta sin límite (AI) se queda con todo lo que cuenta', () => {
  const k = defaultKeep({ ...preview, maxBusinesses: null, maxEmployeesPerBusiness: null })
  assert.deepEqual(k.businessIds.sort(), ['b1', 'b2', 'b3'])
  assert.deepEqual(k.employeeIds.sort(), ['e1', 'e2', 'e3', 'e4'])
})

test('validación como el API', () => {
  assert.equal(validateKeep(preview, { businessIds: ['b2'], employeeIds: ['e3', 'e4'] }), null)
  assert.deepEqual(validateKeep(preview, { businessIds: [], employeeIds: [] }), { code: 'NO_BUSINESS' })
  assert.deepEqual(validateKeep(preview, { businessIds: ['b2', 'b3'], employeeIds: [] }), { code: 'TOO_MANY_BUSINESSES' })
  assert.deepEqual(validateKeep(preview, { businessIds: ['b2'], employeeIds: ['e2', 'e3', 'e4'] }), { code: 'TOO_MANY_EMPLOYEES', businessId: 'b2' })
})

test('payload: fuera los trabajadores de negocios que no quedan', () => {
  assert.deepEqual(keepPayload(preview, { businessIds: ['b1'], employeeIds: ['e1', 'e3'] }), { businessIds: ['b1'], employeeIds: ['e1'] })
  assert.equal(validateKeep(preview, { businessIds: ['b1'], employeeIds: ['e1', 'e3', 'e4'] }), null)
})

test('toggle', () => {
  assert.deepEqual(toggleId(['a'], 'b'), ['a', 'b'])
  assert.deepEqual(toggleId(['a', 'b'], 'a'), ['b'])
})
