// Panel Boss: clasificar cuentas en cliente / tester / equipo, y las nuevas sin revisar.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { filterBusinesses, countByFilter, defaultFilter, newAccounts, withKind, matchesFilter, countKinds } from './accountKinds.js'

const biz = (id, ownerId, accountKind = null, createdAt = '2026-10-01T10:00:00') => ({ id, ownerId, ownerName: `Dueño ${ownerId}`, accountKind, createdAt })

test('cada pestaña cuenta lo suyo y «todos» lo cuenta todo', () => {
  const list = [biz('a', 'w', 'CUSTOMER'), biz('b', 't', 'TESTER'), biz('c', 'f', 'TEAM'), biz('d', 'n'), biz('e', 'n2')]
  assert.deepEqual(countByFilter(list), { customers: 1, new: 2, testers: 1, team: 1, all: 5 })
  assert.deepEqual(filterBusinesses(list, 'customers').map((b) => b.id), ['a'])
  assert.deepEqual(filterBusinesses(list, 'new').map((b) => b.id), ['d', 'e'])
})

test('las listas se abren siempre en «Clientes»', () => {
  assert.equal(defaultFilter(), 'customers')
})

test('cuentas nuevas: las sin revisar y los clientes de los últimos 7 días; una por dueño, la más nueva primero', () => {
  const now = new Date('2026-10-30T18:00:00').getTime()
  const list = [
    biz('a', 'old', null, '2026-10-01T09:00:00'),
    biz('b', 'fresh', 'CUSTOMER', '2026-10-29T18:00:00'),
    biz('c', 'old', null, '2026-10-05T09:00:00'),
    biz('d', null, null),
    biz('e', 'william', 'CUSTOMER', '2026-09-20T10:00:00'),
    biz('f', 'qa', 'TESTER', '2026-10-30T10:00:00'),
  ]
  const fresh = newAccounts(list, now)
  assert.deepEqual(fresh.map((p) => p.ownerId), ['fresh', 'old'])
  assert.equal(fresh[0].kind, 'CUSTOMER')
  assert.deepEqual(fresh[1].businesses.map((b) => b.id), ['a', 'c'])
  assert.equal(fresh[1].createdAt, '2026-10-01T09:00:00')
})

test('clasificar a un dueño cambia todos sus negocios y ninguno más', () => {
  const list = [biz('a', 'w'), biz('b', 'w'), biz('c', 'x')]
  assert.deepEqual(withKind(list, 'w', 'CUSTOMER').map((b) => b.accountKind), ['CUSTOMER', 'CUSTOMER', null])
})

test('Negocios y Owners: misma regla de pestañas sobre su propia lista', () => {
  assert.equal(matchesFilter(undefined, 'new'), true)
  assert.equal(matchesFilter('TEAM', 'team'), true)
  assert.equal(matchesFilter('TEAM', 'customers'), false)
  const owners = [{ id: 1 }, { id: 2 }, { id: 3 }]
  const kinds = { 1: 'CUSTOMER', 2: 'TESTER' }
  assert.deepEqual(countKinds(owners, (o) => kinds[o.id]), { customers: 1, new: 1, testers: 1, team: 0, all: 3 })
})
