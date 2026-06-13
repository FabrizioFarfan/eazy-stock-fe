import { forwardRef, useEffect, useRef, useState } from 'react'
import { isDivisibleUnit, isKiloUnit, gramsEquivalent } from '../../utils/quantity'

/**
 * Input de cantidad escribible (sin steppers +/-).
 *
 * El cajero tipea la cantidad directamente — soluciona el feedback de "no
 * avanzar de uno en uno". Permite decimales solo si la unidad del producto es
 * divisible (kilo/litro/metro/custom); para "unidad" fuerza enteros. Para
 * productos en kilo muestra el equivalente en gramos como ayuda.
 *
 *  - `value`  número (o null/'' para vacío).
 *  - `onChange(next)` número o null.
 *  - `unit`   unidad del producto — decide decimales y la ayuda en gramos.
 *  - `max`    tope opcional (ej. stock disponible); resalta en rojo si se excede.
 *  - `maxDecimals` decimales máximos cuando es divisible (default 3 → gramos).
 */
const QuantityInput = forwardRef(function QuantityInput(
  {
    value,
    onChange,
    unit = 'unidad',
    max = null,
    disabled = false,
    maxDecimals = 3,
    label,
    error,
    className = '',
    autoFocus = false,
    placeholder = '0',
  },
  ref,
) {
  const inputRef = useRef(null)
  const divisible = isDivisibleUnit(unit)

  useEffect(() => {
    if (typeof ref === 'function') ref(inputRef.current)
    else if (ref) ref.current = inputRef.current
  }, [ref])

  useEffect(() => {
    if (autoFocus && !disabled && inputRef.current) {
      const id = setTimeout(() => inputRef.current?.focus(), 0)
      return () => clearTimeout(id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Estado string local — conserva lo que el usuario tipea ("1." mientras escribe).
  const [text, setText] = useState(() => initText(value))
  const lastEmittedRef  = useRef(numericValue(text))

  useEffect(() => {
    const incoming = value == null || value === '' ? null : Number(value)
    if (incoming === lastEmittedRef.current) return
    setText(initText(value))
    lastEmittedRef.current = incoming
  }, [value])

  const emit = (next) => {
    const n = numericValue(next)
    lastEmittedRef.current = n
    onChange?.(n)
  }

  const handleChange = (e) => {
    let raw = e.target.value.replace(',', '.')
    // Solo dígitos y un punto.
    raw = raw.replace(/[^\d.]/g, '')
    const firstDot = raw.indexOf('.')
    if (firstDot >= 0) {
      raw = raw.slice(0, firstDot + 1) + raw.slice(firstDot + 1).replace(/\./g, '')
    }
    if (!divisible) {
      // Producto por unidad: sin parte decimal.
      raw = raw.replace(/\..*$/, '')
    } else if (firstDot >= 0) {
      // Cap de decimales.
      const [whole, dec] = raw.split('.')
      raw = whole + '.' + dec.slice(0, maxDecimals)
    }
    setText(raw)
    emit(raw)
  }

  const numeric  = numericValue(text)
  const exceeds  = max != null && numeric != null && numeric > Number(max) + 1e-9
  const grams    = divisible && isKiloUnit(unit) ? gramsEquivalent(numeric) : null

  const borderCls = (error || exceeds)
    ? 'border-red-300 focus-within:border-red-500 focus-within:ring-red-500/20'
    : 'border-gray-200 focus-within:border-blue-600 focus-within:ring-blue-600/20'

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <label className="text-sm font-medium text-gray-700">{label}</label>
      )}

      <div
        className={`flex items-center gap-2 rounded-xl border bg-white px-3 py-2 ring-2 ring-transparent transition-colors focus-within:ring-2 ${borderCls} ${
          disabled ? 'cursor-not-allowed bg-gray-50 opacity-70' : ''
        }`}
      >
        <input
          ref={inputRef}
          type="text"
          inputMode={divisible ? 'decimal' : 'numeric'}
          autoComplete="off"
          disabled={disabled}
          value={text}
          placeholder={placeholder}
          onChange={handleChange}
          onFocus={(e) => e.target.select()}
          className="min-w-0 flex-1 bg-transparent text-right text-sm font-semibold text-gray-900 outline-none placeholder-gray-300 disabled:cursor-not-allowed"
          aria-label={label || 'Cantidad'}
        />
        {unit && (
          <span className="select-none text-sm font-medium text-gray-400">{unit}</span>
        )}
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}
      {!error && exceeds && (
        <p className="text-xs text-red-500">Supera el stock disponible ({max})</p>
      )}
      {!error && !exceeds && grams && (
        <p className="text-xs text-gray-400">= {grams}</p>
      )}
    </div>
  )
})

export default QuantityInput

// ── helpers ──────────────────────────────────────────────────────────────

function initText(value) {
  if (value == null || value === '') return ''
  const n = typeof value === 'number' ? value : parseFloat(value)
  if (!Number.isFinite(n)) return ''
  // Sin ceros decimales sobrantes.
  return String(n)
}

function numericValue(text) {
  if (text == null || text === '' || text === '.') return null
  const n = parseFloat(text)
  return Number.isFinite(n) ? n : null
}
