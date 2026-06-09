import { usePriceInputMode } from '../../hooks/usePriceInputMode'

/**
 * Toggle para alternar cómo se tipean los precios en toda la app. La elección
 * queda guardada en localStorage (ver usePriceInputMode), así que se recuerda
 * entre sesiones y se aplica a cada PriceInput al instante.
 */
export default function PriceInputModeToggle({ className = '' }) {
  const [mode, setMode] = usePriceInputMode()

  const base   = 'rounded-md px-2 py-1 font-mono text-[11px] font-semibold leading-none transition-colors'
  const active = 'bg-white text-blue-700 shadow-sm'
  const idle   = 'text-gray-400 hover:text-gray-600'

  return (
    <div className={`inline-flex items-center gap-0.5 rounded-lg border border-gray-200 bg-gray-100 p-0.5 ${className}`}>
      <button
        type="button"
        onClick={() => setMode('split')}
        title="Separado: escribís la parte entera y los decimales por separado"
        aria-pressed={mode === 'split'}
        className={`${base} ${mode === 'split' ? active : idle}`}
      >
        25 . 50
      </button>
      <button
        type="button"
        onClick={() => setMode('calculator')}
        title="Calculadora: tipeás los dígitos y los decimales se llenan solos (2550 → 25.50)"
        aria-pressed={mode === 'calculator'}
        className={`${base} ${mode === 'calculator' ? active : idle}`}
      >
        2550
      </button>
    </div>
  )
}
