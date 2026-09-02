import { useState } from 'react'
import { COUNTRIES, getDefaultCountry, splitPhone, toE164 } from '../../utils/phone'

const selectCls = 'shrink-0 rounded-xl border border-gray-200 bg-white px-2 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20'
const inputCls  = 'w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 placeholder-gray-400'

const derive = (value) => {
  const p = splitPhone(value, getDefaultCountry())
  return { from: value ?? '', iso: p.iso || getDefaultCountry(), national: p.national }
}

/**
 * Teléfono con prefijo de país. `value` es el E.164 guardado ("+51987654321")
 * o vacío; `onChange` recibe el E.164 nuevo (o '' al vaciar). El país arranca
 * en el del negocio (o el que traiga un valor ya guardado) y el número se
 * escribe sin prefijo, como lo dicta la gente: "987 654 321".
 *
 * El estado interno recuerda de qué `value` salió (`from`): si el padre manda
 * otro (abrir "editar", elegir un cliente) se vuelve a derivar; lo que el
 * usuario tipea nunca se le reescribe debajo de los dedos.
 */
export default function PhoneInput({ value, onChange, placeholder = '987 654 321', className = '', disabled = false, autoFocus = false, inputProps = {} }) {
  const [state, setState] = useState(() => derive(value))
  if ((value ?? '') !== state.from) {
    // valor nuevo desde fuera → derivar de nuevo (patrón de estado derivado de React)
    setState(derive(value))
  }

  const emit = (iso, national) => {
    const next = toE164(iso, national)
    setState({ from: next, iso, national })
    onChange(next)
  }

  return (
    <div className={`flex gap-2 ${className}`}>
      <select
        value={state.iso}
        disabled={disabled}
        onChange={(e) => emit(e.target.value, state.national)}
        className={selectCls}
        aria-label="País"
      >
        {COUNTRIES.map((c) => (
          <option key={c.iso} value={c.iso}>{c.flag} +{c.dial}</option>
        ))}
      </select>
      <input
        value={state.national}
        disabled={disabled}
        autoFocus={autoFocus}
        inputMode="tel"
        placeholder={placeholder}
        onChange={(e) => emit(state.iso, e.target.value.replace(/[^\d\s]/g, ''))}
        className={inputCls}
        {...inputProps}
      />
    </div>
  )
}
