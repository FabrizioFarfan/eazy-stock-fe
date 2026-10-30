// Panel Boss: clasificar cuentas en cliente / tester / equipo, y las nuevas sin revisar.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { filterBusinesses, countByFilter, defaultFilter, pendingAccounts, withKind } from './accountKinds.js'

const biz = (id, ownerId, accountKind = null, createdAt = '2026-10-01T10:00:00') => ({ id, ownerId, ownerName: `Dueño ${ownerId}`, accountKind, createdAt })

test('cada pestaña cuenta lo suyo y «todos» lo cuenta todo', () => {
  const list = [biz('a', 'w', 'CUSTOMER'), biz('b', 't', 'TESTER'), biz('c', 'f', 'TEAM'), biz('d', 'n'), biz('e', 'n2')]
  assert.deepEqual(countByFilter(list), { customers: 1, new: 2, testers: 1, team: 1, all: 5 })
  assert.deepEqual(filterBusinesses(list, 'customers').map((b) => b.id), ['a'])
  assert.deepEqual(filterBusinesses(list, 'new').map((b) => b.id), ['d', 'e'])
})

test('se abre en clientes si hay; si no, en lo nuevo; si no, en todo', () => {
  assert.equal(defaultFilter([biz('a', 'w', 'CUSTOMER'), biz('d', 'n')]), 'customers')
  assert.equal(defaultFilter([biz('b', 't', 'TESTER'), biz('d', 'n')]), 'new')
  assert.equal(defaultFilter([biz('b', 't', 'TESTER')]), 'all')
  assert.equal(defaultFilter([]), 'all')
})

test('las cuentas por revisar: una por dueño, la más nueva primero, sin los negocios sin dueño', () => {
  const list = [
    biz('a', 'old', null, '2026-10-01T09:00:00'),
    biz('b', 'new', null, '2026-10-29T18:00:00'),
    biz('c', 'old', null, '2026-10-05T09:00:00'),
    biz('d', null, null),
    biz('e', 'w', 'CUSTOMER'),
  ]
  const pending = pendingAccounts(list)
  assert.deepEqual(pending.map((p) => p.ownerId), ['new', 'old'])
  assert.deepEqual(pending[1].businesses.map((b) => b.id), ['a', 'c'])
  assert.equal(pending[1].createdAt, '2026-10-01T09:00:00')
})

test('clasificar a un dueño cambia todos sus negocios y ninguno más', () => {
  const list = [biz('a', 'w'), biz('b', 'w'), biz('c', 'x')]
  assert.deepEqual(withKind(list, 'w', 'CUSTOMER').map((b) => b.accountKind), ['CUSTOMER', 'CUSTOMER', null])
})
