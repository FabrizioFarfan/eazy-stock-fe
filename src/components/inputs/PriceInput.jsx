import { forwardRef, useEffect, useRef, useState } from 'react'

const CURRENCY_SYMBOL = {
  PEN: 'S/',
  USD: '$',
  EUR: '€',
  PLN: 'zł',
}

const ONLY_DIGITS = /\D/g

/**
 * Split price input — one box for the whole part, a literal dot, one box for
 * decimals. The user types digits where they belong; no POS-calculator
 * masking ("400" becoming "4.00"), no first-digit-is-decimal magic.
 *
 *  - `value` is a number (e.g. 25.5037) or null/undefined for empty.
 *  - `onChange(next)` fires with a number (or null when both fields are empty).
 *  - `maxDecimals` caps the decimal field length (1-6, default 6).
 *  - Tab/Enter from the whole field jumps to the decimal field.
 *
 * Empty whole + empty decimals → `null`; empty decimals alone → `25`.
 */
const PriceInput = forwardRef(function PriceInput(
  {
    value,
    onChange,
    currency = 'PEN',
    disabled = false,
    maxDecimals = 6,
    label,
    error,
    helperText,
    placeholderWhole = '0',
    placeholderDecimals = '00',
    className = '',
  },
  ref,
) {
  const wholeRef   = useRef(null)
  const decimalRef = useRef(null)

  // Expose the whole-part input as the forwarded ref so RHF / focus() target it.
  // Falling back to a noop when ref is a callback ref is fine — common React.
  useEffect(() => {
    if (typeof ref === 'function') ref(wholeRef.current)
    else if (ref) ref.current = wholeRef.current
  }, [ref])

  // Local string state — keeps the user's exact typing (e.g. "0357" stays "0357",
  // not collapsed to "357"). We re-sync from `value` only when it changes from
  // outside, not on our own onChange echoes.
  const [whole,    setWhole]    = useState(() => initWhole(value))
  const [decimals, setDecimals] = useState(() => initDecimals(value))
  const lastEmittedRef = useRef(numericValue(whole, decimals))

  useEffect(() => {
    // Only re-split when the external value diverges from what we just emitted —
    // avoids cursor jumps while the user is typing.
    const incoming = value == null ? null : Number(value)
    if (incoming === lastEmittedRef.current) return
    setWhole(initWhole(value))
    setDecimals(initDecimals(value))
    lastEmittedRef.current = incoming
  }, [value])

  const emit = (w, d) => {
    const n = numericValue(w, d)
    lastEmittedRef.current = n
    onChange?.(n)
  }

  const handleWholeChange = (e) => {
    const next = e.target.value.replace(ONLY_DIGITS, '').slice(0, 10)
    setWhole(next)
    emit(next, decimals)
  }

  const handleDecimalChange = (e) => {
    const next = e.target.value.replace(ONLY_DIGITS, '').slice(0, maxDecimals)
    setDecimals(next)
    emit(whole, next)
  }

  const handleWholeKeyDown = (e) => {
    if ((e.key === 'Tab' && !e.shiftKey) || e.key === 'Enter' || e.key === '.' || e.key === ',') {
      // Enter + dot/comma both jump to the decimals field — natural for someone
      // tipeando "25.50" with the period key.
      e.preventDefault()
      decimalRef.current?.focus()
    }
  }

  const symbol = CURRENCY_SYMBOL[currency] ?? currency

  const borderCls = error
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
        <span className="font-mono text-sm font-semibold text-gray-400 select-none">
          {symbol}
        </span>
        <input
          ref={wholeRef}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="off"
          disabled={disabled}
          value={whole}
          placeholder={placeholderWhole}
          onChange={handleWholeChange}
          onKeyDown={handleWholeKeyDown}
          onFocus={(e) => e.target.select()}
          className="min-w-0 flex-1 bg-transparent text-right text-sm font-semibold text-gray-900 outline-none placeholder-gray-300 disabled:cursor-not-allowed"
          aria-label={label ? `${label} — parte entera` : 'Parte entera'}
        />
        <span className="select-none text-base font-bold text-gray-400">.</span>
        <input
          ref={decimalRef}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="off"
          disabled={disabled}
          value={decimals}
          placeholder={placeholderDecimals}
          maxLength={maxDecimals}
          onChange={handleDecimalChange}
          onFocus={(e) => e.target.select()}
          className="min-w-0 w-20 bg-transparent text-left text-sm font-semibold text-gray-900 outline-none placeholder-gray-300 disabled:cursor-not-allowed"
          aria-label={label ? `${label} — decimales` : 'Decimales'}
        />
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}
      {!error && helperText && <p className="text-xs text-gray-400">{helperText}</p>}
    </div>
  )
})

export default PriceInput

// ── helpers ────────────────────────────────────────────────────────────────

function initWhole(value) {
  if (value == null || value === '') return ''
  const n = typeof value === 'number' ? value : parseFloat(value)
  if (!Number.isFinite(n)) return ''
  return String(Math.trunc(Math.abs(n)))
}

function initDecimals(value) {
  if (value == null || value === '') return ''
  const n = typeof value === 'number' ? value : parseFloat(value)
  if (!Number.isFinite(n)) return ''
  // Take up to 6 decimals from the stringified value; drop trailing zeros so
  // "4" comes back as "" (not "00") and "25.5" comes back as "5".
  const fixed = n.toFixed(6)
  const dot = fixed.indexOf('.')
  if (dot < 0) return ''
  return fixed.slice(dot + 1).replace(/0+$/, '')
}

function numericValue(whole, decimals) {
  if (whole === '' && decimals === '') return null
  const w = whole === '' ? '0' : whole
  const d = decimals === '' ? '' : `.${decimals}`
  const n = parseFloat(`${w}${d}`)
  return Number.isFinite(n) ? n : null
}
