import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { ChevronRight, ChevronLeft, X, Sparkles } from 'lucide-react'
import { useT } from '../../i18n'

/**
 * Tutorial interactivo del ProductFormModal.
 *
 * No es un slideshow aparte: se monta encima del modal real, oscurece el
 * fondo y deja un "spotlight" con borde rojo sobre la parte que se está
 * explicando, mientras un cartelito al lado describe qué hacer ahí.
 *
 * Los targets se ubican vía atributos `data-tutorial-target="..."` en los
 * elementos del ProductFormModal. Si ninguno de los de un paso existe (por
 * ejemplo «Stock inicial» al editar), el paso cae al modo centrado sin spotlight.
 */
// 14-nov-2026 (Frank: «actualízame bien el tutorial»): sigue el formulario de hoy, hoja por hoja y en el orden
// en que se ve (foto y precios · qué es · códigos y parámetros · de dónde viene y dónde está). Un paso puede
// señalar varios trozos a la vez (`targets`): el recuadro rojo abarca todos.
const STEPS = [
  {
    targets: [],
    title: 'Así se carga un producto',
    desc: 'Te voy señalando en rojo cada parte del formulario y te digo qué va ahí. Solo lo marcado con * es obligatorio: precio de compra, precio de venta, stock mínimo, nombre y proveedor. Lo demás lo completas cuando quieras. Para salir, la X de este cartel.',
  },
  {
    targets: ['photo'],
    title: 'Foto del producto',
    desc: 'Opcional. Sube una imagen (en el celular también puedes tomarla con la cámara). Se ve en la ficha y como miniatura en las listas, para que quien vende reconozca el producto de un vistazo.',
  },
  {
    targets: ['price-variable', 'price-format', 'price-fields'],
    title: 'Hoja 1 · Precios',
    desc: 'P. compra es lo que te cuesta; P. venta es lo que cobras. Si el precio se negocia con cada cliente, marca «Precio variable» y se pedirá al vender. «Formato del precio» cambia cómo lo escribes: 2 decimales (tecleas 1150 y queda 11.50) o hasta 6 decimales para precios muy pequeños.',
  },
  {
    targets: ['stock-fields', 'expiry'],
    title: 'Hoja 1 · Stock y vencimiento',
    desc: 'Stock mínimo: cuando quede esa cantidad o menos, la app te avisa para que repongas. Stock inicial (solo al crear): cuánto tienes hoy. Si el producto caduca, ponle fecha de vencimiento y te avisamos antes de que venza.',
  },
  {
    targets: ['name-unit'],
    title: 'Hoja 2 · Nombre y unidad',
    desc: 'El nombre es como lo vas a buscar y como sale en la venta (ej. «Aceite 5W30»). La unidad es cómo lo vendes: unidad, metro, kilo, litro u otra que escribas. Si ya tienes un producto con ese nombre, te avisamos aquí mismo para que no lo repitas.',
  },
  {
    targets: ['sku', 'presentation', 'description'],
    title: 'Hoja 2 · Código, presentación y descripción',
    desc: 'El código del producto se pone solo si lo dejas vacío: seguimos tu numeración. Presentación es cómo viene («Saco de 25 kg», «Caja de 100») y no cambia cómo se vende. La descripción es una nota libre. Los tres son opcionales.',
  },
  {
    targets: ['codes'],
    title: 'Hoja 3 · Códigos',
    desc: 'Código de barras: el que trae impreso el empaque. Escríbelo o léelo con la cámara; después, al vender, lo escaneas y el producto sale solo. Código proveedor: el código con que tu proveedor lo llama en su factura; sirve para buscarlo y para armarle el pedido.',
  },
  {
    targets: ['parameters'],
    title: 'Hoja 3 · Parámetros',
    desc: 'Lo que distingue a este producto de otros parecidos: color, medida, material, peso… Toca «Añadir parámetro» y elige uno, o crea el tuyo con «Nuevo parámetro…». Si la categoría propone alguno, sale arriba en azul. Rellena solo los que apliquen: después filtras por ellos en Productos y en Stock.',
  },
  {
    targets: ['supplier-picker'],
    title: 'Hoja 4 · Proveedor',
    desc: 'Obligatorio: a quién le compras este producto. Tócalo en la lista (si hay muchos, usa el buscador). Si no está, «Nuevo proveedor» lo crea sin salir de aquí. No es la marca: el proveedor es quien te lo vende.',
  },
  {
    targets: ['brand-picker'],
    title: 'Hoja 4 · Marca',
    desc: 'Opcional: quién lo fabrica (Bosch, Stanley, 3M…). Elígela de la lista o créala con «Nueva marca». Luego puedes filtrar tus productos por marca.',
  },
  {
    targets: ['category-picker'],
    title: 'Hoja 4 · Categoría',
    desc: 'Opcional: el tipo de producto (Tornillería, Pinturas, Plomería…). No es una marca ni un proveedor. Al elegirla, la categoría puede proponerte sus parámetros en la hoja 3. Si no existe, créala con «Nueva categoría».',
  },
  {
    targets: ['location-picker'],
    title: 'Hoja 4 · Ubicación',
    desc: 'Opcional: dónde está guardado en tu negocio (Almacén 1, Estante B3, Vitrina). Así cualquiera lo encuentra sin preguntar. Si falta, «Nueva ubicación».',
  },
  {
    targets: ['save-button'],
    title: 'Guardar',
    desc: 'Cuando termines, guarda. Si falta algo obligatorio, aquí abajo sale la lista en rojo y un toque te lleva al campo. Si el precio de venta queda por debajo del costo o cambia mucho, te preguntamos antes de guardar.',
  },
  {
    targets: [],
    title: '¡Listo!',
    desc: 'Ya conoces todo el formulario. Este tutorial está siempre en el botón «Tutorial», arriba a la derecha de esta ventana.',
  },
]

/** Los trozos del formulario que señala un paso (los que existan ahora mismo). */
function findTargets(step) {
  return (step.targets ?? [])
    .map((id) => document.querySelector(`[data-tutorial-target="${id}"]`))
    .filter(Boolean)
}

/** El recuadro que abarca todos los trozos, o null si no hay ninguno a la vista. */
function unionRect(els) {
  const rects = els.map((el) => el.getBoundingClientRect()).filter((r) => r.width > 0 && r.height > 0)
  if (rects.length === 0) return null
  const top = Math.min(...rects.map((r) => r.top))
  const left = Math.min(...rects.map((r) => r.left))
  const right = Math.max(...rects.map((r) => r.right))
  const bottom = Math.max(...rects.map((r) => r.bottom))
  return { top, left, width: right - left, height: bottom - top }
}

function sameRect(a, b) {
  return !!a && !!b && a.top === b.top && a.left === b.left && a.width === b.width && a.height === b.height
}

const CALLOUT_W = 340
const CALLOUT_H = 220
const GAP = 14

export default function ProductFormTutorial({ onClose }) {
  const t = useT()
  const [step, setStep]             = useState(0)
  const [targetRect, setTargetRect] = useState(null)
  const [, forceRerender]           = useState(0)
  const stepRef                     = useRef(null)
  const current = STEPS[step]
  const isLast  = step === STEPS.length - 1
  const hasTarget = current.targets.length > 0

  // Lleva el primer trozo a la vista (dentro de su hoja o del modal) y mide el conjunto.
  useLayoutEffect(() => {
    stepRef.current = current
    const measure = () => setTargetRect((prev) => { const r = unionRect(findTargets(current)); return sameRect(prev, r) ? prev : r })
    const els = findTargets(current)
    if (els.length === 0) { measure(); return }
    els[0].scrollIntoView({ block: els.length > 1 ? 'start' : 'center', behavior: 'smooth' })
    const timer = setTimeout(measure, 350)
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, true)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', measure, true)
    }
  }, [step, current])

  // Mientras hay un trozo señalado se vuelve a medir cada 200 ms: el scroll suave y los campos que aparecen
  // (la cámara, un aviso) lo mueven, y el recuadro tiene que seguirlo.
  useEffect(() => {
    if (!hasTarget) return
    const timer = setInterval(() => forceRerender((x) => x + 1), 200)
    return () => clearInterval(timer)
  }, [hasTarget, step])

  useEffect(() => {
    if (!stepRef.current || stepRef.current.targets.length === 0) return
    const r = unionRect(findTargets(stepRef.current))
    setTargetRect((prev) => (sameRect(prev, r) ? prev : r))
  })

  const next = () => (isLast ? onClose() : setStep(step + 1))
  const prev = () => (step > 0 ? setStep(step - 1) : onClose())

  // ── posicionamiento del callout ──────────────────────────────────────────
  // El cartel se coloca con su alto REAL (los textos no miden todos lo mismo): así no tapa lo que señala.
  const calloutRef = useRef(null)
  const [calloutH, setCalloutH] = useState(CALLOUT_H)
  useLayoutEffect(() => {
    const h = calloutRef.current?.offsetHeight
    if (h && h !== calloutH) setCalloutH(h)
  }, [step, calloutH])
  const calloutStyle = computeCalloutPosition(targetRect, calloutH)

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
        ref={calloutRef}
        className="fixed w-[340px] max-w-[calc(100vw-32px)] rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 transition-all duration-200"
        style={calloutStyle}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-2 px-5 pt-4 pb-2">
          <div className="flex items-center gap-2">
            {!targetRect && <Sparkles size={16} className="text-blue-600" />}
            <span className="text-xs font-bold uppercase tracking-widest text-blue-600">
              {t('Paso')} {step + 1} / {STEPS.length}
            </span>
          </div>
          <button
            onClick={onClose}
            title={t('Cerrar tutorial')}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 pb-3">
          <h3 className="mb-1.5 text-base font-bold text-gray-900">{t(current.title)}</h3>
          <p className="text-sm leading-relaxed text-gray-600">{t(current.desc)}</p>
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
            {step === 0 ? t('Omitir') : t('Atrás')}
          </button>

          <button
            onClick={next}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
          >
            {isLast ? t('¡Entendido!') : t('Siguiente')}
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
function computeCalloutPosition(rect, calloutH = CALLOUT_H) {
  const vw = typeof window !== 'undefined' ? window.innerWidth  : 1024
  const vh = typeof window !== 'undefined' ? window.innerHeight :  768

  if (!rect) {
    return {
      top:  Math.max(16, vh / 2 - calloutH / 2),
      left: Math.max(16, vw / 2 - CALLOUT_W / 2),
    }
  }

  const spaceBelow = vh - (rect.top + rect.height) - GAP
  const spaceAbove = rect.top - GAP
  const spaceRight = vw - (rect.left + rect.width) - GAP

  // Preferimos abajo
  if (spaceBelow >= calloutH) {
    return {
      top:  rect.top + rect.height + GAP,
      left: clamp(rect.left + rect.width / 2 - CALLOUT_W / 2, 16, vw - CALLOUT_W - 16),
    }
  }
  // Si no, arriba
  if (spaceAbove >= calloutH) {
    return {
      top:  rect.top - calloutH - GAP,
      left: clamp(rect.left + rect.width / 2 - CALLOUT_W / 2, 16, vw - CALLOUT_W - 16),
    }
  }
  // Si no, al costado donde quepa
  const spaceLeft = rect.left - GAP
  const sideTop = clamp(rect.top + rect.height / 2 - calloutH / 2, 16, vh - calloutH - 16)
  if (spaceRight >= CALLOUT_W) return { top: sideTop, left: rect.left + rect.width + GAP }
  if (spaceLeft >= CALLOUT_W) return { top: sideTop, left: rect.left - CALLOUT_W - GAP }
  // No cabe en ningún lado (celular, o un trozo muy alto): al borde de la pantalla que quede más lejos del
  // centro de lo señalado, para tapar lo menos posible.
  const targetMid = rect.top + rect.height / 2
  return {
    top:  targetMid < vh / 2 ? vh - calloutH - 16 : 16,
    left: clamp(rect.left + rect.width / 2 - CALLOUT_W / 2, 16, Math.max(16, vw - CALLOUT_W - 16)),
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
