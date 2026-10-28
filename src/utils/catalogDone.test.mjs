import { test } from 'node:test'
import assert from 'node:assert/strict'
import { isCatalogDone, markCatalogDone, showCatalogBanner } from './catalogDone.js'

const memory = () => { const m = new Map(); return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)) } }

test('el aviso solo sale si el servidor confirma 0 productos y nadie lo marcó como listo', () => {
  assert.equal(showCatalogBanner({ done: false, loading: false, error: false, total: 0 }), true)
  assert.equal(showCatalogBanner({ done: false, loading: false, error: false, total: 1200 }), false)
  assert.equal(showCatalogBanner({ done: true, loading: false, error: false, total: 0 }), false)
  assert.equal(showCatalogBanner({ done: false, loading: true, error: false, total: undefined }), false)
  assert.equal(showCatalogBanner({ done: false, loading: false, error: true, total: undefined }), false)
  assert.equal(showCatalogBanner({ done: false, loading: false, error: false, total: undefined }), false)
})

test('«listo» se recuerda por negocio y no falla sin almacenamiento', () => {
  const storage = memory()
  assert.equal(isCatalogDone('biz-1', storage), false)
  markCatalogDone('biz-1', storage)
  assert.equal(isCatalogDone('biz-1', storage), true)
  assert.equal(isCatalogDone('biz-2', storage), false)
  const broken = { getItem: () => { throw new Error('no') }, setItem: () => { throw new Error('no') } }
  assert.equal(isCatalogDone('biz-1', broken), false)
  markCatalogDone('biz-1', broken)
})
