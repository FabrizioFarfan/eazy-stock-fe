import { usePriceInputMode } from '../../hooks/usePriceInputMode'

/**
 * Toggle para alternar cómo se escribe el precio en toda la app. La elección
 * queda guardada en localStorage (ver usePriceInputMode), así que se recuerda
 * entre sesiones y se aplica a cada PriceInput al instante.
 *
 *  - 'calculator' → 2 decimales fijos, estilo caja registradora.
 *  - 'split'      → parte entera y hasta 6 decimales por separado.
 */
export default function PriceInputModeToggle({ className = '' }) {
  const [mode, setMode] = usePriceInputMode()

  const base   = 'flex flex-col items-center rounded-md px-2.5 py-1 transition-colors'
  const active = 'bg-white text-blue-700 shadow-sm'
  const idle   = 'text-gray-400 hover:text-gray-600'

  return (
    <div className={`inline-flex items-center gap-0.5 rounded-lg border border-gray-200 bg-gray-100 p-0.5 ${className}`}>
      <button
        type="button"
        onClick={() => setMode('calculator')}
        title="Estilo calculadora: escribes los dígitos y los decimales se llenan solos (1150 → 11.50). Siempre 2 decimales."
        aria-pressed={mode === 'calculator'}
        className={`${base} ${mode === 'calculator' ? active : idle}`}
      >
        <span className="font-mono text-[11px] font-bold leading-none">11.50</span>
        <span className="mt-0.5 text-[9px] leading-none">2 decimales</span>
      </button>
      <button
        type="button"
        onClick={() => setMode('split')}
        title="Separado: escribes la parte entera y los decimales en casillas distintas. Permite hasta 6 decimales (ej. 0.0357)."
        aria-pressed={mode === 'split'}
        className={`${base} ${mode === 'split' ? active : idle}`}
      >
        <span className="font-mono text-[11px] font-bold leading-none">0.0357</span>
        <span className="mt-0.5 text-[9px] leading-none">hasta 6 dec.</span>
      </button>
    </div>
  )
}
