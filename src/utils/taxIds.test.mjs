// `npm test`: la tabla de casos del API (src/test/resources/tax-ids.json de eazy-stock-be,
// copiada en __fixtures__) tiene que dar EXACTAMENTE lo mismo que TaxIdsTest.java.
// Runner de node (sin dependencias). Además los @Test sueltos de TaxIdsTest.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  normalize, isValidFor, isValidPeruRuc, checkDigitMismatch, labelFor, typeFor, duplicateMessage, invalidMessage,
} from './taxIds.js'

const table = JSON.parse(readFileSync(new URL('./__fixtures__/tax-ids.json', import.meta.url), 'utf8'))

for (const c of table.normalize) {
  test(`«${c.raw}» → ${c.normalized}`, () => assert.equal(normalize(c.raw), c.normalized))
}

for (const [country, spec] of Object.entries(table.countries)) {
  test(`${country} etiqueta ${spec.label}`, () => assert.equal(labelFor(country), spec.label))
  for (const v of spec.valid) {
    test(`${country} válido ${v.value} (${v.holder})`, () => {
      assert.equal(isValidFor(country, normalize(v.value)), true, v.value)
      assert.equal(checkDigitMismatch(country, normalize(v.value)), v.checkDigit === false, v.value)
    })
  }
  for (const v of spec.invalid) {
    test(`${country} inválido ${v.value} (${v.reason})`, () => assert.equal(isValidFor(country, normalize(v.value)), false, v.value))
  }
}

test('normalizar no rompe las letras', () => {
  assert.equal(normalize('61.704.000-k'), '61704000K')
  assert.equal(normalize('b-5837843-1'), 'B58378431')
  assert.equal(normalize('x 2482300 w'), 'X2482300W')
  assert.equal(normalize('v-11470283-4'), 'V114702834')
  assert.equal(normalize('nwm-970924-4w4'), 'NWM9709244W4')
  assert.equal(normalize('ab&c 680524'), 'AB&C680524')
  assert.equal(normalize('\t20 131\n312-955 '), '20131312955')
  assert.equal(normalize(' .-  '), null)
  assert.equal(normalize(null), null)
})

test('RFC mexicano: el verificador mal no bloquea, el formato, la fecha y los genéricos sí', () => {
  assert.equal(isValidFor('MX', 'NWM9709244W4'), true)
  assert.equal(checkDigitMismatch('MX', 'NWM9709244W4'), false)
  assert.equal(isValidFor('MX', 'NWM9709244W5'), true)
  assert.equal(checkDigitMismatch('MX', 'NWM9709244W5'), true)
  assert.equal(isValidFor('MX', 'NWM9713244W4'), false)
  assert.equal(isValidFor('MX', 'XAXX010101000'), false)
  assert.equal(isValidFor('MX', 'NWM97092'), false)
  assert.equal(checkDigitMismatch('MX', 'NWM97092'), false)
  assert.equal(checkDigitMismatch('PE', '20131312956'), false)
  assert.equal(invalidMessage('MX').includes('verificador'), false)
})

test('RUC peruano: prefijo 16 rechazado', () => {
  assert.equal(isValidPeruRuc('16100070972'), false)
  assert.equal(isValidPeruRuc('20131312955'), true)
  assert.equal(isValidPeruRuc('10400470907'), true)
  assert.equal(isValidFor('PE', '16100070972'), false)
})

test('mensajes con el documento del país', () => {
  assert.equal(duplicateMessage('PE'), 'Este RUC ya tiene una cuenta en Eazy Stock. Si es tuyo, inicia sesión o escríbenos.')
  assert.ok(duplicateMessage('ES').startsWith('Este NIF ya tiene'))
  assert.ok(duplicateMessage('CO').startsWith('Este NIT ya tiene'))
  assert.ok(duplicateMessage('CR').startsWith('Esta cédula jurídica ya tiene'))
  assert.ok(duplicateMessage('ZZ').startsWith('Este número de identificación fiscal ya tiene'))
  assert.ok(invalidMessage('PE').includes('10, 15, 17 o 20') && !invalidMessage('PE').includes('16'))
  assert.ok(invalidMessage('CO').startsWith('Este NIT no es válido'))
})

test('tipo y etiqueta por país', () => {
  const expected = {
    PE: 'RUC', AR: 'CUIT', CL: 'RUT', CO: 'NIT', MX: 'RFC', BO: 'NIT', EC: 'RUC', ES: 'NIF', UY: 'RUT', PY: 'RUC',
    VE: 'RIF', GT: 'NIT', DO: 'RNC', CR: 'CEDULA_JURIDICA', PA: 'RUC', HN: 'RTN', SV: 'NIT', NI: 'RUC', DE: 'TAX_ID',
  }
  for (const [c, t] of Object.entries(expected)) assert.equal(typeFor(c), t, c)
  assert.equal(labelFor('CR'), 'Cédula jurídica')
  assert.equal(typeFor(null), 'TAX_ID')
})
