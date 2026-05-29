import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { ChevronRight, ChevronLeft, X, Sparkles } from 'lucide-react'

/**
 * Tutorial interactivo del ProductFormModal.
 *
 * No es un slideshow aparte: se monta encima del modal real, oscurece el
 * fondo y deja un "spotlight" con borde rojo sobre la parte que se está
 * explicando, mientras un cartelito al lado describe qué hacer ahí.
 *
 * Los targets se ubican vía atributos `data-tutorial-target="..."` en los
 * elementos del ProductFormModal. Si un target no existe (por ejemplo el
 * picker no se renderizó), el paso cae al modo centrado sin spotlight.
 */
const STEPS = [
  {
    target: null,
    title: '¡Vamos a cargar tu primer producto!',
    desc: 'Te voy a ir señalando con rojo cada parte del formulario y te explico qué va. Si querés saltarlo, tocá la X arriba a la derecha. Podés volver desde Ajustes cuando quieras.',
  },
  {
    target: 'name-unit',
    title: '1. Nombre y unidad',
    desc: 'Empezá por acá. El nombre va a aparecer en tu catálogo (ej. "Aceite 5W30"). La unidad es cómo lo vendés: litros, kg, metros, unidad, galón. Los dos son obligatorios.',
  },
  {
    target: 'brand-picker',
    title: '2. Marca: el fabricante',
    desc: 'Acá va quién fabrica el producto: Bosch, Stanley, 3M, Castrol... Escribí en el buscador. Si no aparece, tocá "Nueva marca" y lo creás al toque.',
  },
  {
    target: 'supplier-picker',
    title: '3. Proveedor: a quién le comprás',
    desc: 'Distinto a la marca. El proveedor es de dónde sacás vos el producto (ej. "Distribuidora Lima SAC", "Ferreconstruye"). Mismo patrón: buscás o tocás "Nuevo proveedor".',
  },
  {
    target: 'category-picker',
    title: '4. Categoría: tipo de producto',
    desc: 'Cómo agrupás el producto: Tornillería, Pinturas, Plomería, Herramientas. OJO: no es una marca ni un proveedor. Si tu negocio es ferretería, ya tenés 9 categorías default cargadas.',
  },
  {
    target: 'attributes',
    title: '5. Atributos: lo que distingue al producto',
    desc: 'Esto es opcional pero re útil. Acá ponés lo que diferencia a este producto del resto: color, tamaño, material, peso, voltaje... lo que quieras. Tocá los chips grises para sumar uno, o agregá tuyos.',
  },
  {
    target: 'prices',
    title: '6. Precios y stock mínimo',
    desc: 'P. compra es lo que pagás. P. venta es lo que cobrás. Truco: tipeá solo dígitos, "1150" se muestra "11.50" solo. Stock mínimo dispara una alerta cuando se acerca a esa cantidad.',
  },
  {
    target: 'save-button',
    title: '7. Guardar',
    desc: 'Cuando termines, tocá Guardar. El sistema le asigna un código (SKU) automáticamente y lo agrega a tu catálogo. Ya está, listo para vender.',
  },
  {
    target: null,
    title: '¡Listo!',
    desc: 'Ya conocés todas las partes del formulario. Si te trabás en algo, este tutorial está siempre en Ajustes → Ayuda. ¡A cargar productos!',
    intro: false,
  },
]

const CALLOUT_W = 340
const CALLOUT_H = 220
const GAP = 14

export default function ProductFormTutorial({ onClose }) {
  const [step, setStep]             = useState(0)
  const [targetRect, setTargetRect] = useState(null)
  const [, forceRerender]           = useState(0)
  const targetIdRef                 = useRef(null)
  const current = STEPS[step]
  const isLast  = step === STEPS.length - 1

  // Calcular el rect del target (incluye scroll-into-view y reobserva resize).
  useLayoutEffect(() => {
    targetIdRef.current = current.target
    if (!current.target) {
      setTargetRect(null)
      return
    }

    const measure = () => {
      const el = document.querySelector(`[data-tutorial-target="${current.target}"]`)
      if (!el) {
        setTargetRect(null)
        return
      }
      const r = el.getBoundingClientRect()
      setTargetRect({ top: r.top, left: r.left, width: r.width, height: r.height })
    }

    // Scroll al target dentro del modal y medir tras 350ms (esperando el smooth-scroll).
    const el = document.querySelector(`[data-tutorial-target="${current.target}"]`)
    if (el) {
      el.scrollIntoView({ block: 'center', behavior: 'smooth' })
      const t = setTimeout(measure, 350)

      window.addEventListener('resize', measure)
      window.addEventListener('scroll', measure, true)

      return () => {
        clearTimeout(t)
        window.removeEventListener('resize', measure)
        window.removeEventListener('scroll', measure, true)
      }
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [step, current.target])

  // Re-render cada 250ms mientras hay scroll suave del modal por debajo
  // (mantiene el spotlight y el callout pegados al target).
  useEffect(() => {
    if (!current.target) return
    const t = setInterval(() => forceRerender((x) => x + 1), 200)
    return () => clearInterval(t)
  }, [current.target])

  // Re-medir cuando forceRerender cambia.
  useEffect(() => {
    if (!targetIdRef.current) return
    const el = document.querySelector(`[data-tutorial-target="${targetIdRef.current}"]`)
    if (!el) return
    const r = el.getBoundingClientRect()
    setTargetRect((prev) => {
      if (!prev) return { top: r.top, left: r.left, width: r.width, height: r.height }
      if (prev.top === r.top && prev.left === r.left
          && prev.width === r.width && prev.height === r.height) return prev
      return { top: r.top, left: r.left, width: r.width, height: r.height }
    })
  })

  const next = () => (isLast ? onClose() : setStep(step + 1))
  const prev = () => (step > 0 ? setStep(step - 1) : onClose())

  // ── posicionamiento del callout ──────────────────────────────────────────
  const calloutStyle = computeCalloutPosition(targetRect)

  return (
    <div className="fixed inset-0 z-[70]">
      {/* Backdrop oscuro + spotlight */}
      {targetRect ? (
        <>
          {/* Spotlight rojo con cutout vía box-shadow gigante */}
          <div
            className="fixed rounded-xl ring-4 ring-red-500 transition-all duration-200 pointer-events-none"
            style={{
              top:    targetRect.top - 6,
              left:   targetRect.left - 6,
              width:  targetRect.width + 12,
              height: targetRect.height + 12,
              boxShadow: '0 0 0 9999px rgba(0,0,0,0.6)',
            }}
          />
          {/* Punta del puntero entre callout y target — sutil */}
          <PointerArrow targetRect={targetRect} calloutStyle={calloutStyle} />
        </>
      ) : (
        <div className="fixed inset-0 bg-black/60 transition-opacity" />
      )}

      {/* Callout con texto y controles */}
      <div
        className="fixed w-[340px] max-w-[calc(100vw-32px)] rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 transition-all duration-200"
        style={calloutStyle}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-2 px-5 pt-4 pb-2">
          <div className="flex items-center gap-2">
            {!targetRect && <Sparkles size={16} className="text-blue-600" />}
            <span className="text-xs font-bold uppercase tracking-widest text-blue-600">
              Paso {step + 1} / {STEPS.length}
            </span>
          </div>
          <button
            onClick={onClose}
            title="Cerrar tutorial"
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 pb-3">
          <h3 className="mb-1.5 text-base font-bold text-gray-900">{current.title}</h3>
          <p className="text-sm leading-relaxed text-gray-600">{current.desc}</p>
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-1.5 pb-3">
          {STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === step ? 'w-5 bg-blue-600' : 'w-1.5 bg-gray-300 hover:bg-gray-400'
              }`}
            />
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-gray-100 px-4 py-2.5">
          <button
            onClick={prev}
            className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-100"
          >
            {step > 0 && <ChevronLeft size={13} />}
            {step === 0 ? 'Omitir' : 'Atrás'}
          </button>

          <button
            onClick={next}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
          >
            {isLast ? '¡Entendido!' : 'Siguiente'}
            {!isLast && <ChevronRight size={13} />}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Devuelve top/left para el callout. Si no hay target → centrado. Si hay
 * target → preferimos debajo, si no entra ponemos arriba, si tampoco hacia
 * el costado. Siempre clampeado al viewport.
 */
function computeCalloutPosition(rect) {
  const vw = typeof window !== 'undefined' ? window.innerWidth  : 1024
  const vh = typeof window !== 'undefined' ? window.innerHeight :  768

  if (!rect) {
    return {
      top:  Math.max(16, vh / 2 - CALLOUT_H / 2),
      left: Math.max(16, vw / 2 - CALLOUT_W / 2),
    }
  }

  const spaceBelow = vh - (rect.top + rect.height) - GAP
  const spaceAbove = rect.top - GAP
  const spaceRight = vw - (rect.left + rect.width) - GAP

  // Preferimos abajo
  if (spaceBelow >= CALLOUT_H) {
    return {
      top:  rect.top + rect.height + GAP,
      left: clamp(rect.left + rect.width / 2 - CALLOUT_W / 2, 16, vw - CALLOUT_W - 16),
    }
  }
  // Si no, arriba
  if (spaceAbove >= CALLOUT_H) {
    return {
      top:  rect.top - CALLOUT_H - GAP,
      left: clamp(rect.left + rect.width / 2 - CALLOUT_W / 2, 16, vw - CALLOUT_W - 16),
    }
  }
  // Si no, derecha o izquierda
  if (spaceRight >= CALLOUT_W) {
    return {
      top:  clamp(rect.top + rect.height / 2 - CALLOUT_H / 2, 16, vh - CALLOUT_H - 16),
      left: rect.left + rect.width + GAP,
    }
  }
  return {
    top:  clamp(rect.top + rect.height / 2 - CALLOUT_H / 2, 16, vh - CALLOUT_H - 16),
    left: clamp(rect.left - CALLOUT_W - GAP, 16, vw - CALLOUT_W - 16),
  }
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n))
}

/**
 * Flechita conectora entre el callout y el target. Solo decorativa, no
 * bloquea clicks. Usa la dirección del callout vs target para apuntar bien.
 */
function PointerArrow({ targetRect, calloutStyle }) {
  if (!targetRect) return null
  const calloutCenterX = calloutStyle.left + CALLOUT_W / 2
  const calloutTop     = calloutStyle.top
  const targetCenterX  = targetRect.left + targetRect.width / 2
  const targetBottom   = targetRect.top + targetRect.height

  const below = calloutTop > targetBottom
  if (!below) return null // sólo dibujamos cuando el callout está abajo, es el caso más común

  return (
    <div
      className="fixed pointer-events-none"
      style={{
        top:  targetBottom + 4,
        left: clamp(targetCenterX - 6, 16, window.innerWidth - 28),
        width: 12,
        height: calloutTop - targetBottom - 8,
      }}
    >
      <div className="h-full w-px bg-red-500/70 mx-auto" />
    </div>
  )
}
