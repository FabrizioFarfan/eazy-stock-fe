import { forwardRef, useEffect, useRef, useState } from 'react'
import { usePriceInputMode } from '../../hooks/usePriceInputMode'

const CURRENCY_SYMBOL = {
  PEN: 'S/',
  USD: '$',
  EUR: '€',
  PLN: 'zł',
}

const ONLY_DIGITS = /\D/g

/**
 * Input de precio con dos modos (ver usePriceInputMode), elegibles por el usuario
 * y recordados en localStorage:
 *
 *  - 'split' (por defecto): una casilla para la parte entera, un punto literal y
 *    otra para los decimales. Lo que tipeás es lo que ves, sin masking.
 *    "25" + "50" → 25.50; "0" + "0357" → 0.0357.
 *  - 'calculator': estilo caja registradora. Tipeás un chorro de dígitos y los
 *    decimales se llenan solos de derecha a izquierda. "2550" → 25.50; "1" → 0.01.
 *    Siempre 2 decimales (la costumbre del POS).
 *
 *  - `value` es un número (ej. 25.5037) o null/undefined para vacío.
 *  - `onChange(next)` dispara con un número (o null cuando el campo queda vacío).
 *  - `maxDecimals` limita el campo de decimales en modo 'split' (1-6, default 6).
 *  - Tab/Enter desde la parte entera salta a los decimales (modo 'split').
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
    autoFocus = false,
  },
  ref,
) {
  const [mode] = usePriceInputMode()

  const symbol = CURRENCY_SYMBOL[currency] ?? currency

  const borderCls = error
    ? 'border-red-300 focus-within:border-red-500 focus-within:ring-red-500/20'
    : 'border-gray-200 focus-within:border-blue-600 focus-within:ring-blue-600/20'

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <label className="text-sm font-medium text-gray-700">{label}</label>
      )}

      {mode === 'calculator' ? (
        <div
          className={`flex items-center gap-2 rounded-xl border bg-white px-3 py-2 ring-2 ring-transparent transition-colors focus-within:ring-2 ${borderCls} ${
            disabled ? 'cursor-not-allowed bg-gray-50 opacity-70' : ''
          }`}
        >
          <span className="font-mono text-sm font-semibold text-gray-400 select-none">
            {symbol}
          </span>
          <CalculatorBody
            ref={ref}
            value={value}
            onChange={onChange}
            disabled={disabled}
            autoFocus={autoFocus}
            placeholder={`${placeholderWhole}.${placeholderDecimals}`}
            label={label}
          />
        </div>
      ) : (
        <SplitBody
          ref={ref}
          value={value}
          onChange={onChange}
          disabled={disabled}
          maxDecimals={maxDecimals}
          autoFocus={autoFocus}
          placeholderWhole={placeholderWhole}
          placeholderDecimals={placeholderDecimals}
          label={label}
          symbol={symbol}
          error={error}
        />
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}
      {!error && helperText && <p className="text-xs text-gray-400">{helperText}</p>}
    </div>
  )
})

export default PriceInput

// ── SplitBody — dos casillas "entero . decimales" ────────────────────────────

const SplitBody = forwardRef(function SplitBody(
  {
    value,
    onChange,
    disabled,
    maxDecimals,
    autoFocus,
    placeholderWhole,
    placeholderDecimals,
    label,
    symbol,
    error,
  },
  ref,
) {
  const wholeRef   = useRef(null)
  const decimalRef = useRef(null)

  // Expone la parte entera como ref reenviada para que focus()/RHF la apunten.
  useEffect(() => {
    if (typeof ref === 'function') ref(wholeRef.current)
    else if (ref) ref.current = wholeRef.current
  }, [ref])

  // Autofoco al montar — usado por el POS para productos con precio variable.
  useEffect(() => {
    if (autoFocus && !disabled && wholeRef.current) {
      const id = setTimeout(() => wholeRef.current?.focus(), 0)
      return () => clearTimeout(id)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Estado local en string — conserva el tipeo exacto ("0357" sigue "0357").
  const [whole,    setWhole]    = useState(() => initWhole(value))
  const [decimals, setDecimals] = useState(() => initDecimals(value))
  const lastEmittedRef = useRef(numericValue(whole, decimals))

  useEffect(() => {
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
      e.preventDefault()
      decimalRef.current?.focus()
    }
  }

  // Cada casilla con su propio borde para que se vea CLARÍSIMO que enteros y
  // decimales son campos distintos (el usuario tendía a tipear todo en uno solo
  // y poner el punto a mano). Rótulos chiquitos debajo refuerzan la separación.
  const boxBorder = error
    ? 'border-red-300 focus:border-red-500 focus:ring-red-500/30'
    : 'border-gray-300 focus:border-blue-600 focus:ring-blue-600/25'
  const boxBase = `w-full rounded-lg border-2 bg-white px-2.5 py-2 text-sm font-semibold text-gray-900 outline-none ring-2 ring-transparent transition-colors focus:ring-2 placeholder-gray-300 disabled:cursor-not-allowed disabled:bg-gray-50 ${boxBorder}`
  const caption = 'mt-1 text-center text-[10px] font-semibold uppercase tracking-wide text-gray-400 select-none'

  return (
    <div className="flex items-start gap-2">
      {symbol && (
        <span className="pt-2.5 font-mono text-sm font-semibold text-gray-400 select-none">
          {symbol}
        </span>
      )}

      <div className="flex flex-1 flex-col">
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
          className={`${boxBase} text-right`}
          aria-label={label ? `${label} — parte entera` : 'Parte entera'}
        />
        <span className={caption}>Enteros</span>
      </div>

      <span className="select-none pt-1.5 text-2xl font-bold leading-none text-gray-400">.</span>

      <div className="flex flex-1 flex-col">
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
          className={`${boxBase} text-left`}
          aria-label={label ? `${label} — decimales` : 'Decimales'}
        />
        <span className={caption}>Decimales</span>
      </div>
    </div>
  )
})

// ── CalculatorBody — masking estilo caja registradora ────────────────────────

const CalculatorBody = forwardRef(function CalculatorBody(
  { value, onChange, disabled, autoFocus, placeholder, label },
  ref,
) {
  const inputRef = useRef(null)

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

  // Estado interno: cadena de dígitos sin separadores ("1150" → 11.50).
  const [digits, setDigits] = useState(() => numberToDigits(value))
  const lastEmittedRef = useRef(digitsToNumber(numberToDigits(value)))

  useEffect(() => {
    const incoming = value == null ? null : Number(value)
    if (incoming === lastEmittedRef.current) return
    setDigits(numberToDigits(value))
    lastEmittedRef.current = incoming
  }, [value])

  const handleChange = (e) => {
    const next = e.target.value.replace(ONLY_DIGITS, '').slice(0, 12)
    setDigits(next)
    const n = digitsToNumber(next)
    lastEmittedRef.current = n
    onChange?.(n)
  }

  return (
    <input
      ref={inputRef}
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      autoComplete="off"
      disabled={disabled}
      value={digitsToDisplay(digits)}
      placeholder={placeholder}
      onChange={handleChange}
      onFocus={(e) => e.target.select()}
      className="min-w-0 flex-1 bg-transparent text-right text-sm font-semibold text-gray-900 outline-none placeholder-gray-300 disabled:cursor-not-allowed"
      aria-label={label ?? 'Precio'}
    />
  )
})

// ── helpers: modo split ──────────────────────────────────────────────────────

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
  // Hasta 6 decimales del valor; sin ceros finales: "4" → "", "25.5" → "5".
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

// ── helpers: modo calculator (2 decimales fijos) ─────────────────────────────

function numberToDigits(value) {
  if (value == null || value === '') return ''
  const n = typeof value === 'number' ? value : parseFloat(value)
  if (!Number.isFinite(n) || n === 0) return ''
  // 11.5 → "1150"; redondea a centavos.
  return String(Math.round(Math.abs(n) * 100))
}

function digitsToNumber(digits) {
  if (!digits) return null
  const n = parseInt(digits, 10) / 100
  return Number.isFinite(n) ? n : null
}

function digitsToDisplay(digits) {
  if (!digits) return ''
  const padded  = digits.padStart(3, '0')
  const intPart = padded.slice(0, -2).replace(/^0+(?=\d)/, '')
  const dec     = padded.slice(-2)
  return `${intPart}.${dec}`
}
