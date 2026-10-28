import { useImperativeHandle, useRef } from 'react'
import { useT } from '../../i18n'
import { CODE_LENGTH, fillDigits, backspaceDigits, isComplete } from '../../utils/emailCode'

/**
 * Las 6 casillas del código (EMAIL-CODE-SPEC.md): pegar el código entero rellena todas, borrar
 * vuelve a la anterior, flechas para moverse. Al completar la 6.ª llama a `onComplete(code)`
 * (la pantalla evita repetir el mismo código); Enter con las 6 → `onComplete(code, { force: true })`.
 * Lo usan /confirmar-correo y Ajustes › Mi perfil › Cambiar correo. `ref.focus(i)` enfoca una casilla.
 */
export default function CodeBoxes({ ref, digits, onDigits, onComplete, disabled, error, testIdPrefix = 'code-digit' }) {
  const t = useT()
  const inputs = useRef([])
  const focusBox = (i) => setTimeout(() => inputs.current[i]?.focus(), 0)
  useImperativeHandle(ref, () => ({ focus: focusBox }), [])

  const apply = ({ digits: next, focus }) => {
    onDigits(next)
    focusBox(focus)
    if (isComplete(next)) onComplete(next.join(''))
  }
  const onChange = (i) => (e) => apply(fillDigits(digits, i, e.target.value))
  const onPaste = (i) => (e) => {
    const text = e.clipboardData?.getData('text') ?? ''
    if (!/\d/.test(text)) return
    e.preventDefault()
    apply(fillDigits(digits, i, text))
  }
  const onKeyDown = (i) => (e) => {
    if (e.key === 'Backspace') { e.preventDefault(); apply(backspaceDigits(digits, i)) }
    else if (e.key === 'ArrowLeft' && i > 0) { e.preventDefault(); focusBox(i - 1) }
    else if (e.key === 'ArrowRight' && i < CODE_LENGTH - 1) { e.preventDefault(); focusBox(i + 1) }
    else if (e.key === 'Enter' && isComplete(digits)) { e.preventDefault(); onComplete(digits.join(''), { force: true }) }
  }

  return (
    <div className="flex justify-between gap-2" role="group" aria-label={t('Código de 6 dígitos')}>
      {digits.map((d, i) => (
        <input key={i} ref={(el) => { inputs.current[i] = el }}
          value={d} onChange={onChange(i)} onPaste={onPaste(i)} onKeyDown={onKeyDown(i)}
          onFocus={(e) => e.target.select()}
          type="text" inputMode="numeric" pattern="[0-9]*" maxLength={CODE_LENGTH}
          autoComplete={i === 0 ? 'one-time-code' : 'off'} disabled={disabled}
          aria-label={t('Dígito {n}', { n: i + 1 })} data-testid={`${testIdPrefix}-${i}`}
          className={`h-14 w-full min-w-0 rounded-xl border text-center font-mono text-2xl font-bold text-gray-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 disabled:opacity-60 ${
            error ? 'border-red-300' : 'border-gray-200'}`} />
      ))}
    </div>
  )
}
