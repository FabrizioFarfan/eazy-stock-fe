import test from 'node:test'
import assert from 'node:assert/strict'
import {
  attrKeyFor, attrValueFor, withParamValue, freeAttributeKeys, normalizeYesNo,
  paramFiltersToQuery, countActiveParamFilters, paramFilterChips, displayValue, attributesDelta } from './parameters.js'

const params = [
  { id: 'c', name: 'Color', type: 'OPTIONS', options: ['Rojo', 'Azul'] },
  { id: 'l', name: 'Largo', type: 'NUMBER', unit: 'cm' },
  { id: 'a', name: 'Artesanal', type: 'YES_NO' },
]

test('el valor del parámetro se lee del mapa sin importar mayúsculas y se escribe con el nombre oficial', () => {
  const attrs = { color: 'Rojo', 'Nota': 'libre' }
  assert.equal(attrKeyFor(attrs, 'Color'), 'color')
  assert.equal(attrValueFor(attrs, 'Color'), 'Rojo')
  const next = withParamValue(attrs, 'Color', 'Azul')
  assert.deepEqual(next, { Nota: 'libre', Color: 'Azul' })
  assert.deepEqual(withParamValue(next, 'Color', ''), { Nota: 'libre' })
  assert.deepEqual(freeAttributeKeys(next, params), ['Nota'])
})

test('Sí/No se normaliza venga como venga', () => {
  assert.equal(normalizeYesNo('si'), 'Sí')
  assert.equal(normalizeYesNo('YES'), 'Sí')
  assert.equal(normalizeYesNo('0'), 'No')
  assert.equal(normalizeYesNo('quizá'), '')
})

test('el filtro solo manda lo que tiene algo y los chips se leen con su medida', () => {
  const f = { c: { value: 'Rojo' }, l: { min: '10', max: '' }, a: { value: '' }, zz: { value: 'x' } }
  assert.deepEqual(paramFiltersToQuery(f), { pf: { c: 'Rojo', zz: 'x' }, pfMin: { l: '10' } })
  assert.equal(countActiveParamFilters(f), 3)
  assert.deepEqual(paramFilterChips(f, params), [{ id: 'c', label: 'Color: Rojo' }, { id: 'l', label: 'Largo: ≥ 10 cm' }])
  assert.deepEqual(paramFiltersToQuery({}), {})
  assert.equal(countActiveParamFilters({}), 0)
})

test('un número se muestra con su medida una sola vez', () => {
  assert.equal(displayValue(params[1], '25'), '25 cm')
  assert.equal(displayValue(params[1], '25 cm'), '25 cm')
  assert.equal(displayValue(params[0], 'Rojo'), 'Rojo')
})

test('de la factura solo viaja lo que cambió, y vacío quita el parámetro', () => {
  assert.deepEqual(attributesDelta({ Color: 'Rojo', Marca: 'x' }, { Color: 'Rojo', Marca: 'x' }), {})
  assert.deepEqual(attributesDelta({ Color: 'Rojo' }, { Color: 'Azul', Material: 'Acero' }), { Color: 'Azul', Material: 'Acero' })
  assert.deepEqual(attributesDelta({ Color: 'Rojo', Peso: '2' }, { Peso: '2' }), { Color: '' })
  assert.deepEqual(attributesDelta({ color: 'Rojo' }, { Color: 'Rojo' }), {})
  assert.deepEqual(attributesDelta(null, undefined), {})
})
