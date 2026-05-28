import { useState, useEffect } from 'react'

/**
 * Input de precio con masking de decimales en el teclado del POS:
 *   Usuario tipea "1"    → muestra "0.01"
 *   Usuario tipea "1150" → muestra "11.50"
 *   Usuario tipea "0"    → muestra "0.00"
 *
 * Internamente trabajamos en centavos (entero), y al `onChange` reportamos
 * el valor decimal real (BigDecimal-friendly: "11.50", "0.00").
 *
 * Props:
 *  - value       (string|number): valor controlado en decimal (ej. 11.50)
 *  - onChange    (string): callback con el nuevo decimal como string
 *  - onBlur      callback opcional para integrarse con react-hook-form
 *  - inputMode   por defecto "numeric" para teclado de POS en móviles
 */
export default function MoneyInput({
  value,
  onChange,
  onBlur,
  className = '',
  placeholder = '0.00',
  name,
  disabled,
}) {
  // Estado interno: cadena de dígitos sin separadores ("1150" → 11.50).
  const [digits, setDigits] = useState(() => decimalToDigits(value))

  // Sincronizar cuando el padre cambie el valor (ej. reset al editar producto).
  useEffect(() => {
    setDigits(decimalToDigits(value))
  }, [value])

  const handleChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '')
    // Tope práctico para evitar overflow visual (max 12 dígitos = 99,999,999,9.99)
    const next = raw.slice(0, 12)
    setDigits(next)
    onChange?.(digitsToDecimal(next))
  }

  return (
    <input
      type="text"
      inputMode="numeric"
      autoComplete="off"
      name={name}
      value={digitsToDisplay(digits)}
      onChange={handleChange}
      onBlur={onBlur}
      placeholder={placeholder}
      disabled={disabled}
      className={className}
    />
  )
}

// ── helpers ────────────────────────────────────────────────────────────────

function decimalToDigits(v) {
  if (v === '' || v === null || v === undefined) return ''
  const n = typeof v === 'number' ? v : parseFloat(v)
  if (Number.isNaN(n)) return ''
  // 11.5 → "1150"; 0 → ""
  if (n === 0) return ''
  return String(Math.round(n * 100))
}

function digitsToDecimal(digits) {
  if (!digits) return ''
  const padded = digits.padStart(3, '0')
  const intPart = padded.slice(0, -2)
  const dec = padded.slice(-2)
  return `${parseInt(intPart, 10)}.${dec}`
}

function digitsToDisplay(digits) {
  if (!digits) return ''
  const padded = digits.padStart(3, '0')
  const intPart = padded.slice(0, -2).replace(/^0+(?=\d)/, '')
  const dec = padded.slice(-2)
  return `${intPart}.${dec}`
}
