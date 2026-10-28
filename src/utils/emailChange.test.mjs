// Cambiar el correo (EMAIL-CHANGE-SPEC.md): pantalla del código (A), Ajustes en dos pasos (B),
// Mi perfil sin el correo y textos en en/it. El api y la sesión son falsos: nunca se llama al API.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import {
  emailChangeError, changeEmailBeforeVerify, codeScreenAfterChange, requestEmailChange, confirmEmailChange,
  profilePayload, cleanEmail,
} from './emailChange.js'

const t = (k, v) => (v ? k.replace(/\{(\w+)\}/g, (_, x) => v[x]) : k)
const fallback = () => 'Ocurrió un error inesperado. Intentá de nuevo.'
const apiError = (status, data) => Object.assign(new Error(`HTTP ${status}`), { response: { status, data } })

/** api falso: responde por ruta (función o valor) y apunta cada llamada. */
function fakeApi(routes) {
  const calls = []
  return {
    calls,
    post: async (url, body) => {
      calls.push({ url, body })
      const r = routes[url]
      const out = typeof r === 'function' ? r(body, calls.length) : r
      if (out instanceof Error) throw out
      return { data: { success: true, message: 'ok', data: out } }
    },
  }
}
function fakeSession() {
  const saved = []
  return { saved, replaceSession: async (auth) => { saved.push(auth) } }
}
const authResponse = (email, emailVerificationRequired) => ({
  accessToken: `access-${email}`, refreshToken: `refresh-${email}`, emailVerificationRequired,
  user: { id: 7, email, name: 'Ana', role: 'OWNER', emailVerified: !emailVerificationRequired, emailVerificationRequired },
})

// ── A. Pantalla del código ─────────────────────────────────────────────────

test('A: cambiar el correo guarda la sesión nueva y la pantalla muestra el correo nuevo, casillas vacías y 60 s', async () => {
  const api = fakeApi({ '/auth/verify/change-email': authResponse('nuevo@gmail.com', true) })
  const s = fakeSession()
  const r = await changeEmailBeforeVerify({ api, replaceSession: s.replaceSession, t, fallback }, { newEmail: '  Nuevo@Gmail.com ', password: 'secreta' })
  assert.deepEqual(api.calls, [{ url: '/auth/verify/change-email', body: { newEmail: 'nuevo@gmail.com', password: 'secreta' } }])
  assert.equal(s.saved.length, 1)
  assert.equal(s.saved[0].accessToken, 'access-nuevo@gmail.com')
  assert.equal(s.saved[0].refreshToken, 'refresh-nuevo@gmail.com')
  assert.equal(s.saved[0].user.email, 'nuevo@gmail.com')
  assert.deepEqual(r, { ok: true, email: 'nuevo@gmail.com' })
  assert.deepEqual(codeScreenAfterChange(t, r.email), {
    digits: ['', '', '', '', '', ''], wait: 60, notice: 'Te mandamos un código a nuevo@gmail.com.',
  })
})

test('A: contraseña mal → bajo «Tu contraseña» y la sesión no se toca', async () => {
  const api = fakeApi({ '/auth/verify/change-email': apiError(400, { code: 'WRONG_PASSWORD', field: 'password', message: 'La contraseña no es correcta' }) })
  const s = fakeSession()
  const r = await changeEmailBeforeVerify({ api, replaceSession: s.replaceSession, t, fallback }, { newEmail: 'a@b.com', password: 'x' })
  assert.deepEqual(r, { ok: false, code: 'WRONG_PASSWORD', field: 'password', message: 'La contraseña no es correcta.' })
  assert.equal(s.saved.length, 0)
})

test('A: errores del correo → bajo «Correo nuevo»', async () => {
  for (const [code, msg] of [
    ['INVALID_EMAIL', 'Ese correo no es válido.'],
    ['EMAIL_DISPOSABLE', 'Usa un correo permanente, no uno temporal.'],
    ['SAME_EMAIL', 'Ese ya es tu correo.'],
    ['EMAIL_ALREADY_REGISTERED', 'Ese correo ya tiene una cuenta en Eazy Stock.'],
  ]) {
    const api = fakeApi({ '/auth/verify/change-email': apiError(code === 'EMAIL_ALREADY_REGISTERED' ? 409 : 400, { code, field: 'email' }) })
    const r = await changeEmailBeforeVerify({ api, replaceSession: async () => assert.fail('no debe guardar'), t, fallback }, { newEmail: 'a@b.com', password: 'x' })
    assert.equal(r.field, 'email', code)
    assert.equal(r.message, msg)
  }
})

test('A: límites y errores ajenos → banner (field null)', async () => {
  const deps = (err) => ({ api: fakeApi({ '/auth/verify/change-email': err }), replaceSession: async () => {}, t, fallback })
  let r = await changeEmailBeforeVerify(deps(apiError(429, { code: 'TOO_MANY_EMAIL_CHANGES', retryAfterSeconds: 3600 })), { newEmail: 'a@b.com', password: 'x' })
  assert.deepEqual([r.field, r.message], [null, 'Ya cambiaste el correo 3 veces hoy. Prueba de nuevo más tarde.'])
  r = await changeEmailBeforeVerify(deps(apiError(429, { code: 'TOO_MANY_REQUESTS', retryAfterSeconds: 600 })), { newEmail: 'a@b.com', password: 'x' })
  assert.deepEqual([r.field, r.message], [null, 'Demasiados intentos. Prueba de nuevo en 10 minutos.'])
  r = await changeEmailBeforeVerify(deps(apiError(403, { code: 'FORBIDDEN', message: 'Tu correo ya está confirmado' })), { newEmail: 'a@b.com', password: 'x' })
  assert.deepEqual([r.field, r.message], [null, fallback()])
})

test('el 400 de @Valid marca newEmail → va al campo del correo', () => {
  assert.deepEqual(emailChangeError(t, { code: 'INVALID_FIELD', field: 'newEmail' }), { field: 'email', message: 'Ese correo no es válido.' })
  assert.deepEqual(emailChangeError(t, { code: 'INVALID_FIELD', field: 'password' }), { field: 'password', message: 'Escribe tu contraseña.' })
  assert.equal(emailChangeError(t, { code: 'NOT_FOUND' }), null)
})

// ── B. Ajustes › Mi perfil, en dos pasos ───────────────────────────────────

test('B paso 1: pide el código para el correo nuevo y NO cambia la sesión', async () => {
  const api = fakeApi({ '/me/email/change': { newEmail: 'nuevo@gmail.com', codeExpiresAt: '2026-10-28T12:15:00' } })
  const r = await requestEmailChange({ api, t, fallback }, { newEmail: 'Nuevo@gmail.com', password: 'secreta' })
  assert.deepEqual(api.calls, [{ url: '/me/email/change', body: { newEmail: 'nuevo@gmail.com', password: 'secreta' } }])
  assert.deepEqual(r, { ok: true, newEmail: 'nuevo@gmail.com', codeExpiresAt: '2026-10-28T12:15:00' })
})

test('B «Reenviar código» repite el paso 1 con los mismos datos', async () => {
  const api = fakeApi({ '/me/email/change': (body) => ({ newEmail: body.newEmail, codeExpiresAt: null }) })
  const sent = { newEmail: 'nuevo@gmail.com', password: 'secreta' }
  await requestEmailChange({ api, t, fallback }, sent)
  await requestEmailChange({ api, t, fallback }, sent)
  assert.equal(api.calls.length, 2)
  assert.deepEqual(api.calls[1], api.calls[0])
})

test('B paso 2: código mal → intentos que quedan, casillas vacías y la sesión sigue igual', async () => {
  const api = fakeApi({ '/me/email/confirm': apiError(400, { code: 'INVALID_CODE', field: 'code', attemptsLeft: 3 }) })
  const s = fakeSession()
  const r = await confirmEmailChange({ api, replaceSession: s.replaceSession, t, fallback }, '123456')
  assert.deepEqual(api.calls, [{ url: '/me/email/confirm', body: { code: '123456' } }])
  assert.equal(r.ok, false)
  assert.equal(r.field, 'code')
  assert.equal(r.message, 'El código no es correcto. Te quedan 3 intentos.')
  assert.equal(r.clearDigits, true)
  assert.equal(s.saved.length, 0)
})

test('B paso 2: bloqueado y caducado → sus textos; otro dueño del correo → bajo el correo', async () => {
  const run = async (data) => confirmEmailChange({ api: fakeApi({ '/me/email/confirm': apiError(400, data) }), replaceSession: async () => {}, t, fallback }, '000000')
  assert.equal((await run({ code: 'CODE_LOCKED' })).message, 'Fallaste 5 veces. Pide un código nuevo.')
  assert.equal((await run({ code: 'CODE_EXPIRED' })).message, 'El código caducó. Pide uno nuevo.')
  const taken = await run({ code: 'EMAIL_ALREADY_REGISTERED', field: 'email' })
  assert.deepEqual([taken.field, taken.message, taken.clearDigits], ['email', 'Ese correo ya tiene una cuenta en Eazy Stock.', false])
})

test('B paso 2: código bueno → la sesión nueva reemplaza a la vieja y avisa con el correo nuevo', async () => {
  const api = fakeApi({ '/me/email/confirm': authResponse('nuevo@gmail.com', false) })
  const s = fakeSession()
  const r = await confirmEmailChange({ api, replaceSession: s.replaceSession, t, fallback }, '654321')
  assert.deepEqual(r, { ok: true, email: 'nuevo@gmail.com' })
  assert.equal(s.saved[0].accessToken, 'access-nuevo@gmail.com')
  assert.equal(s.saved[0].user.emailVerified, true)
  assert.equal(t('Listo: tu correo ahora es {email}.', { email: r.email }), 'Listo: tu correo ahora es nuevo@gmail.com.')
})

// ── Mi perfil ──────────────────────────────────────────────────────────────

test('Mi perfil: PATCH /users/me solo lleva el nombre, nunca el correo', () => {
  assert.deepEqual(profilePayload({ name: ' Ana Pérez ', email: 'otro@gmail.com' }), { name: 'Ana Pérez' })
  assert.equal('email' in profilePayload({ name: 'Ana' }), false)
})

test('cleanEmail', () => assert.equal(cleanEmail('  A@B.Com '), 'a@b.com'))

// ── Textos en en/it ────────────────────────────────────────────────────────

const dictDir = new URL('../i18n/dict/', import.meta.url)
const merged = { en: {}, it: {} }
for (const f of readdirSync(dictDir).filter((f) => f.endsWith('.js'))) {
  const d = (await import(new URL(f, dictDir))).default
  Object.assign(merged.en, d.en ?? {})
  Object.assign(merged.it, d.it ?? {})
}
const keysIn = (rel) => [...readFileSync(new URL(rel, import.meta.url), 'utf8').matchAll(/\bt\('((?:[^'\\]|\\.)+)'/g)].map((m) => m[1])

test('cada texto nuevo tiene traducción en en y en it', async () => {
  const own = (await import('../i18n/dict/emailChange.js')).default
  assert.deepEqual(Object.keys(own.en).sort(), Object.keys(own.it).sort())
  const keys = new Set([
    ...keysIn('./emailChange.js'),
    ...keysIn('../components/email/ChangeEmailDialog.jsx'),
    ...keysIn('../components/email/CodeBoxes.jsx'),
    '¿Correo equivocado? Cámbialo', 'Cambiar correo', 'Listo: tu correo ahora es {email}.',
  ])
  // Los mensajes por código del fallback general (handleApiError.js) para los códigos nuevos.
  const hae = readFileSync(new URL('./handleApiError.js', import.meta.url), 'utf8')
  for (const code of ['WRONG_PASSWORD', 'INVALID_EMAIL', 'EMAIL_DISPOSABLE', 'SAME_EMAIL', 'EMAIL_ALREADY_REGISTERED',
    'TOO_MANY_EMAIL_CHANGES', 'TOO_MANY_REQUESTS', 'USE_EMAIL_CHANGE', 'INVALID_CODE', 'CODE_LOCKED', 'CODE_EXPIRED']) {
    const m = hae.match(new RegExp(`\\b${code}:\\s*'((?:[^'\\\\]|\\\\.)+)'`))
    assert.ok(m, `falta ${code} en handleApiError.js`)
    keys.add(m[1])
  }
  assert.ok(keys.size > 20)
  for (const k of keys) {
    for (const lang of ['en', 'it']) assert.ok(merged[lang][k], `falta «${k}» en ${lang}`)
  }
})
