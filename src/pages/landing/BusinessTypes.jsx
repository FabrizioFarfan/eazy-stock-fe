// ═══════════════════════════════════════════════════════════════════════════
//  «Para todo tipo de negocio» v3 (Frank, 20-oct-2026, task 1040): una FOTO
//  completa por rubro (hechas con IA: solo el inventario, sin personas) en un
//  CARRUSEL lento de borde a borde de la pantalla («que las fotos toquen los
//  lados»). Se mueve solo; al pasar el mouse o tocar en el celular se queda
//  quieto y la ficha muestra su frase; se puede arrastrar. Un foco recorre las
//  fichas una a una (sin barrita de tiempo: Frank no la quiso).
//  Fotos autoalojadas en /business/*.webp (800×1000).
// ═══════════════════════════════════════════════════════════════════════════
import { useEffect, useRef, useState } from 'react'
import { useT } from '../../i18n'
import { Reveal, SectionHead } from './shared'

const TYPES = [
  { key: 'ferreterias',  label: 'Ferreterías',
    blurb: 'Metros, kilos y unidades con decimales. Miles de códigos y el fiado al día.' },
  { key: 'bodegas',      label: 'Bodegas y minimarkets',
    blurb: 'Venta rápida con código de barras y la caja que cuadra cada noche.' },
  { key: 'farmacias',    label: 'Farmacias y boticas',
    blurb: 'Fecha de vencimiento por producto y aviso 30 días antes de perderlo.' },
  { key: 'abarrotes',    label: 'Abarrotes',
    blurb: 'Ventas por kilo o por unidad y el margen real de cada producto.' },
  { key: 'librerias',    label: 'Librerías y bazares',
    blurb: 'Miles de ítems chicos y encuentras cualquiera en un segundo.' },
  { key: 'repuestos',    label: 'Repuestos y talleres',
    blurb: 'Código propio y del proveedor, sin repetidos. Pedidos en PDF.' },
  { key: 'ropa',         label: 'Ropa y calzado',
    blurb: 'Foto por producto: qué se vende y qué se queda en el estante.' },
  { key: 'veterinarias', label: 'Veterinarias y mascotas',
    blurb: 'Alimento por kilo, medicinas con vencimiento y cada cliente con su historial.' },
  { key: 'cafeterias',   label: 'Cafeterías',
    blurb: 'Cobro en segundos, varios vendedores y cierre de caja al final del día.' },
  { key: 'celulares',    label: 'Celulares y electrónica',
    blurb: 'Cotización en PDF por WhatsApp y el stock de accesorios al día.' },
]

const SHOWN = TYPES

const STEP_MS = 2600   // cada cuánto salta el foco
const SPEED = 26       // px/s del carrusel
const RESUME_MS = 2500 // tras soltar en el celular, vuelve a moverse

const reduced = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

export function ForEveryBusiness() {
  const t = useT()
  const sectionRef = useRef(null)
  const trackRef = useRef(null)
  const copyRef = useRef(null)
  const paused = useRef(false)
  const drag = useRef(null)
  const x = useRef(0)
  const resumeTimer = useRef(null)
  const [active, setActive] = useState(0)
  const [hover, setHover] = useState(null)
  const [running, setRunning] = useState(false)
  const [still] = useState(reduced) // reduced motion: carril nativo, sin movimiento

  // Solo se mueve y salta el foco mientras la sección está en pantalla.
  useEffect(() => {
    const el = sectionRef.current
    if (!el) return undefined
    const obs = new IntersectionObserver(([e]) => setRunning(e.isIntersecting), { threshold: 0.15 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    if (!running || hover !== null) return undefined
    const id = setInterval(() => setActive(a => (a + 1) % SHOWN.length), STEP_MS)
    return () => clearInterval(id)
  }, [running, hover])

  // El carrusel: un bucle de animación que desplaza la pista y la rebobina sin corte.
  useEffect(() => {
    if (!running || still) return undefined
    let raf = 0
    let last = performance.now()
    const tick = (now) => {
      const dt = Math.min(64, now - last)
      last = now
      if (!paused.current && !drag.current) x.current -= (SPEED * dt) / 1000
      const w = copyRef.current ? copyRef.current.offsetWidth : 0
      if (w > 0) {
        if (x.current <= -w) x.current += w
        if (x.current > 0) x.current -= w
      }
      if (trackRef.current) trackRef.current.style.transform = `translate3d(${x.current}px,0,0)`
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [running, still])

  const resumeLater = () => {
    clearTimeout(resumeTimer.current)
    resumeTimer.current = setTimeout(() => { paused.current = false; setHover(null) }, RESUME_MS)
  }

  const onPointerDown = (e) => {
    if (still) return
    clearTimeout(resumeTimer.current)
    paused.current = true
    drag.current = { x0: e.clientX, start: x.current, moved: false, type: e.pointerType }
    e.currentTarget.setPointerCapture?.(e.pointerId)
  }
  const onPointerMove = (e) => {
    const d = drag.current
    if (!d) return
    const dx = e.clientX - d.x0
    if (Math.abs(dx) > 4) d.moved = true
    x.current = d.start + dx
  }
  const onPointerUp = (e) => {
    const d = drag.current
    drag.current = null
    if (!d) return
    if (e.pointerType === 'mouse') return // el mouse sigue encima: se queda quieto hasta que se va
    resumeLater()
  }

  const focus = hover ?? active

  const cards = (copy) => SHOWN.map((it, i) => {
    const isFocus = focus === i
    return (
      <article
        key={`${copy}-${it.key}`}
        aria-hidden={copy === 1 ? 'true' : undefined}
        onPointerEnter={(e) => { if (e.pointerType === 'mouse') { paused.current = true; setHover(i); setActive(i) } }}
        onPointerDown={(e) => { if (e.pointerType !== 'mouse') { setHover(i); setActive(i) } }}
        className={`lp-tile group relative h-[clamp(260px,min(48vh,80vw),480px)] shrink-0 select-none overflow-hidden rounded-3xl bg-gray-900 [aspect-ratio:4/5] ${still ? 'snap-center' : ''} ${isFocus ? 'is-focus' : ''}`}
      >
        <img
          src={`/business/${it.key}.webp`}
          alt={t(it.label)}
          width={800}
          height={1000}
          loading={copy === 0 && i < 4 ? 'eager' : 'lazy'}
          decoding="async"
          draggable="false"
          className="pointer-events-none absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        <div className="lp-tile-shade absolute inset-0 bg-gradient-to-t from-blue-950/85 via-blue-950/25 to-transparent opacity-0" />
        <span className="absolute left-4 top-4 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-bold tracking-wider text-white backdrop-blur">
          {String(i + 1).padStart(2, '0')}
        </span>
        {it.chip && (
          <span className="absolute right-4 top-4 rounded-full bg-blue-600 px-3 py-1 text-[11px] font-bold text-white shadow-lg shadow-blue-900/40">
            {t(it.chip)}
          </span>
        )}
        <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
          <h3 className="lp-display text-xl font-extrabold leading-tight text-white sm:text-2xl">{t(it.label)}</h3>
          <div className="lp-tile-blurb overflow-hidden">
            <p className="mt-2 max-w-md text-sm leading-snug text-blue-100 sm:text-base">{t(it.blurb)}</p>
          </div>
        </div>
      </article>
    )
  })

  return (
    <section id="rubros" ref={sectionRef} className="scroll-mt-20 overflow-hidden bg-white py-20 sm:py-24">
      <style>{`
        @keyframes lp-kb { from { transform: scale(1.06) translate(1.5%, 1%) } to { transform: scale(1.14) translate(-1.5%, -1.5%) } }
        .lp-tile img { animation: lp-kb 18s ease-in-out infinite alternate; will-change: transform; }
        .lp-tile:nth-child(even) img { animation-direction: alternate-reverse; }
        .lp-tile .lp-tile-blurb { max-height: 0; opacity: 0; transform: translateY(6px); transition: max-height .5s ease, opacity .45s ease, transform .45s ease; }
        .lp-tile.is-focus .lp-tile-blurb { max-height: 6rem; opacity: 1; transform: none; }
        .lp-tile .lp-tile-shade { transition: opacity .5s ease; }
        .lp-tile.is-focus .lp-tile-shade { opacity: 1; }
        .lp-tile { transition: transform .5s ease; }
        .lp-tile.is-focus { transform: translateY(-6px); box-shadow: 0 24px 48px -20px rgba(30, 64, 175, .45); }
        .lp-rail { scrollbar-width: none; }
        .lp-rail::-webkit-scrollbar { display: none; }
        @media (prefers-reduced-motion: reduce) { .lp-tile img { animation: none !important; } }
      `}</style>
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <Reveal>
          <SectionHead
            kicker={t('Para todo tipo de negocio')}
            title={t('Si vendes y llevas las cuentas, es para ti.')}
            sub={t('Vendas lo que vendas: aquí entra tu mercadería, salen tus ventas y queda claro cuánto ganas. Desde el primer día.')}
          />
        </Reveal>
      </div>

      {/* De borde a borde: fuera del contenedor, sin márgenes */}
      <Reveal>
        {still ? (
          <div className="lp-rail flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 py-3">{cards(0)}</div>
        ) : (
          <div
            className="w-full cursor-grab touch-pan-y py-3 active:cursor-grabbing"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onPointerLeave={(e) => { if (e.pointerType === 'mouse') { paused.current = false; setHover(null) } }}
          >
            <div ref={trackRef} className="flex w-max will-change-transform">
              <div ref={copyRef} className="flex gap-4 pr-4">{cards(0)}</div>
              <div className="flex gap-4 pr-4">{cards(1)}</div>
            </div>
          </div>
        )}
      </Reveal>

      <Reveal className="mt-8 px-5 text-center">
        <p className="text-sm text-gray-500 sm:text-base">{t('¿Tu rubro no está? Si anotas ventas, stock o fiado en un cuaderno, también es para ti.')}</p>
      </Reveal>
    </section>
  )
}
