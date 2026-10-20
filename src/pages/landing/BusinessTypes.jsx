// ═══════════════════════════════════════════════════════════════════════════
//  «Para todo tipo de negocio» v2 (Frank, 20-oct-2026, task 1040): fuera los
//  iconos simples; un MOSAICO grande con una FOTO completa por rubro (hechas con
//  IA: solo el inventario de cada negocio, sin personas) que ocupa la pantalla.
//  Vivo aunque nadie lo toque: cada foto respira (Ken Burns lento) y un foco
//  recorre las fichas una a una mostrando la frase de cada rubro; al pasar el
//  mouse la ficha en foco es la tuya. Fotos autoalojadas en /business/*.webp.
// ═══════════════════════════════════════════════════════════════════════════
import { useEffect, useRef, useState } from 'react'
import { useT } from '../../i18n'
import { Reveal, SectionHead } from './shared'

const TYPES = [
  { key: 'ferreterias',  label: 'Ferreterías',             big: true, chip: 'Aquí nació Eazy Stock',
    blurb: 'Metros, kilos y unidades con decimales. Miles de códigos y el fiado al día.' },
  { key: 'bodegas',      label: 'Bodegas y minimarkets',   big: true,
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
  { key: 'celulares',    label: 'Celulares y electrónica',
    blurb: 'Cotización en PDF por WhatsApp y el stock de accesorios al día.' },
  { key: 'cafeterias',   label: 'Cafeterías',
    blurb: 'Cobro en segundos, varios vendedores y cierre de caja al final del día.' },
]

// Fotos ya generadas; las demás entran al mosaico en cuanto salen del generador.
const READY = new Set(['ferreterias', 'bodegas', 'farmacias', 'abarrotes', 'librerias', 'repuestos'])
const SHOWN = TYPES.filter(t => READY.has(t.key))

const STEP_MS = 2600

export function ForEveryBusiness() {
  const t = useT()
  const ref = useRef(null)
  const [active, setActive] = useState(0)
  const [hover, setHover] = useState(null)
  const [running, setRunning] = useState(false)

  // El foco solo recorre las fichas mientras la sección está en pantalla.
  useEffect(() => {
    const el = ref.current
    if (!el) return undefined
    const obs = new IntersectionObserver(([e]) => setRunning(e.isIntersecting), { threshold: 0.2 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    if (!running || hover !== null) return undefined
    const id = setInterval(() => setActive(a => (a + 1) % SHOWN.length), STEP_MS)
    return () => clearInterval(id)
  }, [running, hover])

  const focus = hover ?? active

  return (
    <section ref={ref} className="bg-white py-20 sm:py-24">
      <style>{`
        @keyframes lp-kb { from { transform: scale(1.06) translate(1.5%, 1%) } to { transform: scale(1.14) translate(-1.5%, -1.5%) } }
        .lp-tile img { animation: lp-kb 18s ease-in-out infinite alternate; will-change: transform; }
        .lp-tile:nth-child(even) img { animation-direction: alternate-reverse; }
        .lp-tile .lp-tile-blurb { max-height: 0; opacity: 0; transform: translateY(6px); transition: max-height .5s ease, opacity .45s ease, transform .45s ease; }
        .lp-tile.is-focus .lp-tile-blurb { max-height: 6rem; opacity: 1; transform: none; }
        .lp-tile .lp-tile-shade { transition: opacity .5s ease; }
        .lp-tile.is-focus .lp-tile-shade { opacity: 1; }
        .lp-tile .lp-tile-bar { transform: scaleX(0); transform-origin: left; }
        .lp-tile.is-focus.is-auto .lp-tile-bar { animation: lp-grow ${STEP_MS}ms linear forwards; }
        .lp-tile.is-focus { box-shadow: 0 24px 48px -20px rgba(30, 64, 175, .45); }
        .lp-rail { scrollbar-width: none; }
        .lp-rail::-webkit-scrollbar { display: none; }
        @media (prefers-reduced-motion: reduce) { .lp-tile img, .lp-tile .lp-tile-bar { animation: none !important; } }
      `}</style>
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <Reveal>
          <SectionHead
            kicker={t('Para todo tipo de negocio')}
            title={t('Si vendes y llevas las cuentas, es para ti.')}
            sub={t('Lo construimos dentro de una ferretería de barrio en Perú y está hecho para bodegas, farmacias, librerías y lo que tú vendas. El mismo sistema, sin configurar nada raro.')}
          />
        </Reveal>

        <Reveal>
          <div
            className="lp-rail -mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-12"
            onMouseLeave={() => setHover(null)}
          >
            {SHOWN.map((it, i) => {
              const isFocus = focus === i
              return (
                <article
                  key={it.key}
                  onMouseEnter={() => { setHover(i); setActive(i) }}
                  onFocus={() => { setHover(i); setActive(i) }}
                  onBlur={() => setHover(null)}
                  tabIndex={0}
                  className={`lp-tile group relative w-[78vw] max-w-sm shrink-0 snap-center overflow-hidden rounded-3xl bg-gray-900 transition-transform duration-500 ease-out sm:w-auto sm:max-w-none ${
                    it.big ? 'aspect-[4/5] sm:col-span-2 sm:aspect-[8/5] lg:col-span-6 lg:row-span-2 lg:aspect-[4/5]' : 'aspect-[4/5] lg:col-span-3'
                  } ${isFocus ? 'is-focus lg:-translate-y-1' : ''} ${hover === null ? 'is-auto' : ''}`}
                >
                  <img
                    src={`/business/${it.key}.webp`}
                    alt={t(it.label)}
                    width={1024}
                    height={1280}
                    loading={i < 3 ? 'eager' : 'lazy'}
                    decoding="async"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                  {/* sombra base + sombra de foco */}
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

                  <div className={`absolute inset-x-0 bottom-0 ${it.big ? 'p-6 sm:p-8' : 'p-5'}`}>
                    <h3 className={`lp-display font-extrabold leading-tight text-white ${it.big ? 'text-2xl sm:text-3xl lg:text-4xl' : 'text-xl'}`}>
                      {t(it.label)}
                    </h3>
                    <div className="lp-tile-blurb overflow-hidden">
                      <p className={`mt-2 leading-snug text-blue-100 ${it.big ? 'text-base sm:text-lg max-w-md' : 'text-sm'}`}>{t(it.blurb)}</p>
                    </div>
                    <div className="mt-3 h-0.5 w-16 overflow-hidden rounded-full bg-white/25">
                      <div className="lp-tile-bar h-full w-full bg-blue-400" />
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        </Reveal>

        <Reveal className="mt-10 text-center">
          <p className="text-sm text-gray-500 sm:text-base">{t('¿Tu rubro no está? Si anotas ventas, stock o fiado en un cuaderno, también es para ti.')}</p>
        </Reveal>
      </div>
    </section>
  )
}
