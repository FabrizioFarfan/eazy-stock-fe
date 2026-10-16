import { useState } from 'react'
import { Star } from 'lucide-react'

/**
 * Piezas con JSX del feedback real (16-oct-2026). Los helpers sin JSX viven en
 * feedbackUtils.js (regla de fast refresh: un archivo de componentes solo exporta componentes).
 */

/**
 * Cinco estrellas. Con onChange son clicables (hover previsualiza); sin onChange
 * solo muestran. `size` en px.
 */
export function Stars({ value = 0, onChange, size = 18, label }) {
  const [hover, setHover] = useState(0)
  const shown = onChange ? (hover || value || 0) : (value || 0)
  const interactive = typeof onChange === 'function'
  return (
    <span className="inline-flex items-center gap-0.5" role={interactive ? 'radiogroup' : undefined} aria-label={label}
      onMouseLeave={() => interactive && setHover(0)}>
      {[1, 2, 3, 4, 5].map((n) => {
        const on = n <= shown
        const cls = `${on ? 'fill-amber-400 text-amber-400' : 'text-gray-300'} ${interactive ? 'transition-transform hover:scale-110' : ''}`
        return interactive ? (
          <button key={n} type="button" role="radio" aria-checked={value === n} aria-label={`${n}`}
            onMouseEnter={() => setHover(n)} onClick={() => onChange(value === n ? 0 : n)}
            className="rounded p-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/40">
            <Star size={size} className={cls} />
          </button>
        ) : (
          <Star key={n} size={size} className={cls} />
        )
      })}
    </span>
  )
}
