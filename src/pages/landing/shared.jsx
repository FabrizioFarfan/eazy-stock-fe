import { useEffect, useRef, useState } from 'react'

// ═══════════════════════════════════════════════════════════════════════════
//  Primitivas de la landing: Reveal, Counter, fondos y keyframes
// ═══════════════════════════════════════════════════════════════════════════

function prefersReducedMotion() {
  return typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** Aparece al hacer scroll; marca `.lp-in` para que los hijos animen (barras, filas…). */
export function Reveal({ children, delay = 0, className = '', as: Tag = 'div' }) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(prefersReducedMotion)

  useEffect(() => {
    const el = ref.current
    if (!el || visible) return undefined
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          obs.disconnect()
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [visible])

  return (
    <Tag
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ease-out ${
        visible ? 'lp-in translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
      } ${className}`}
    >
      {children}
    </Tag>
  )
}

/** Contador animado: sube de 0 a `to` cuando entra en pantalla. */
export function Counter({ to, prefix = '', suffix = '', duration = 1400, className = '' }) {
  const ref = useRef(null)
  const [val, setVal] = useState(prefersReducedMotion() ? to : 0)

  useEffect(() => {
    const el = ref.current
    if (!el || prefersReducedMotion()) return undefined
    let raf
    const obs = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      obs.disconnect()
      const start = performance.now()
      const tick = (now) => {
        const p = Math.min(1, (now - start) / duration)
        const eased = 1 - Math.pow(1 - p, 3)
        setVal(Math.round(to * eased))
        if (p < 1) raf = requestAnimationFrame(tick)
      }
      raf = requestAnimationFrame(tick)
    }, { threshold: 0.4 })
    obs.observe(el)
    return () => { obs.disconnect(); cancelAnimationFrame(raf) }
  }, [to, duration])

  return <span ref={ref} className={className}>{prefix}{val.toLocaleString('es-PE')}{suffix}</span>
}

export function GridPattern({ light = false }) {
  const line = light ? 'rgba(15,23,42,0.5)' : 'rgba(255,255,255,0.4)'
  return (
    <div
      aria-hidden
      className={`absolute inset-0 ${light ? 'opacity-[0.05]' : 'opacity-[0.1]'}`}
      style={{
        backgroundImage: `linear-gradient(${line} 1px, transparent 1px), linear-gradient(90deg, ${line} 1px, transparent 1px)`,
        backgroundSize: '36px 36px',
        maskImage: 'radial-gradient(ellipse at center, black 25%, transparent 78%)',
        WebkitMaskImage: 'radial-gradient(ellipse at center, black 25%, transparent 78%)',
      }}
    />
  )
}

/** Un solo brillo azul, sobrio (20-oct-2026: fuera el celeste/verde/ámbar, «parecía infantil»). */
export function GlowOrbs() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -left-32 top-1/4 h-[28rem] w-[28rem] rounded-full bg-blue-600/25 blur-[130px]" />
      <div className="absolute right-0 top-1/2 h-80 w-80 rounded-full bg-blue-400/10 blur-[120px]" />
    </div>
  )
}

/**
 * Fondo del hero (20-oct-2026, v4 «simple», Frank: «muy cargado; la malla me gustaba;
 * esfumaturas»): la malla con esfumatura, tres manchas de color difuminadas y dos
 * corrientes curvas que entran desde el borde izquierdo hacia la ventana del producto
 * con puntos que viajan (los productos vendiéndose). Sin círculos. Las corrientes solo
 * en escritorio: en el celular pasaban por detrás del texto y no dejaban leer.
 * Reutilizable: Frank quiere este efecto en todas las webs.
 */
// Tres corrientes continuas: nacen fuera del borde izquierdo y mueren fuera del derecho
// (Frank: «parece que se quedaron a la mitad; con inicio y fin»). Se esfuman en ambos
// extremos con un degradado en coordenadas de usuario (no del bbox de cada trazo).
const STREAMS = [
  'M-60 150 C 300 60, 560 310, 860 300 S 1250 110, 1500 80',
  'M-60 760 C 340 830, 620 640, 900 660 S 1250 770, 1500 700',
  'M-60 900 C 400 950, 700 790, 950 830 S 1300 910, 1500 850',
]

export function HeroBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* esfumaturas */}
      <div className="absolute -top-48 right-[-12%] h-[46rem] w-[46rem] rounded-full bg-blue-500/20 blur-[160px]" />
      <div className="absolute bottom-[-24%] left-[-14%] h-[40rem] w-[40rem] rounded-full bg-indigo-600/25 blur-[160px]" />
      <div className="absolute left-[38%] top-1/2 h-[26rem] w-[26rem] -translate-y-1/2 rounded-full bg-sky-400/[0.08] blur-[120px]" />
      {/* la malla, esfumada hacia los bordes */}
      <GridPattern />
      {/* corrientes (solo escritorio) */}
      <svg className="absolute inset-0 hidden h-full w-full lg:block" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" fill="none">
        <defs>
          <filter id="lpb-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <linearGradient id="lpb-stream" gradientUnits="userSpaceOnUse" x1="-60" x2="1500" y1="0" y2="0">
            <stop offset="0" stopColor="#93c5fd" stopOpacity="0" />
            <stop offset=".18" stopColor="#93c5fd" stopOpacity=".55" />
            <stop offset=".5" stopColor="#60a5fa" stopOpacity=".8" />
            <stop offset=".82" stopColor="#93c5fd" stopOpacity=".55" />
            <stop offset="1" stopColor="#93c5fd" stopOpacity="0" />
          </linearGradient>
          {STREAMS.map((d, i) => <path key={i} id={`lpb-s-${i}`} d={d} />)}
        </defs>
        <g filter="url(#lpb-glow)" strokeLinecap="round">
          {STREAMS.map((d, i) => (
            <path key={i} d={d} className="lp-draw" stroke="url(#lpb-stream)" strokeWidth="1.5" style={{ animationDelay: `${i * 0.5}s` }} />
          ))}
          {STREAMS.map((_, i) => [0, 1, 2].map((k) => (
            <circle key={`${i}-${k}`} r={k === 1 ? 3 : 4.5} fill={k === 1 ? '#bfdbfe' : '#60a5fa'} className="lp-particle">
              <animateMotion dur={`${9 + i * 1.5}s`} begin={`${-(i * 2.5 + k * 3.3)}s`} repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.6 1" keyTimes="0;1" keyPoints="0;1">
                <mpath href={`#lpb-s-${i}`} />
              </animateMotion>
            </circle>
          )))}
        </g>
      </svg>
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#0a0e1a] to-transparent" />
    </div>
  )
}

/** Cabecera de sección: kicker + título + bajada. */
export function SectionHead({ kicker, title, sub, dark = false, align = 'center', kickerColor = 'text-blue-600' }) {
  const center = align === 'center'
  return (
    <div className={`mb-12 ${center ? 'text-center' : ''}`}>
      {kicker && (
        <p className={`mb-3 text-xs font-bold uppercase tracking-[0.2em] ${dark ? 'text-blue-300' : kickerColor}`}>
          {kicker}
        </p>
      )}
      <h2 className={`lp-display text-3xl font-extrabold leading-[1.1] tracking-tight sm:text-4xl lg:text-[2.75rem] ${dark ? 'text-white' : 'text-gray-900'}`}>
        {title}
      </h2>
      {sub && (
        <p className={`mt-5 max-w-2xl text-base leading-relaxed sm:text-lg ${center ? 'mx-auto' : ''} ${dark ? 'text-slate-400' : 'text-gray-500'}`}>
          {sub}
        </p>
      )}
    </div>
  )
}

/** Keyframes locales de la landing. */
export function LandingStyles() {
  return (
    <style>{`
      html { scroll-behavior: smooth; }
      .lp-display { font-family: 'Inter Tight', 'Helvetica Neue', Arial, system-ui, sans-serif; letter-spacing: -0.035em; font-weight: 700; }
      @keyframes lp-floaty { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-8px) } }
      @keyframes lp-grow   { from { transform: scaleX(0) } to { transform: scaleX(1) } }
      @keyframes lp-row    { from { opacity: 0; transform: translateX(-8px) } to { opacity: 1; transform: none } }
      @keyframes lp-pop    { 0% { opacity: 0; transform: translateY(10px) scale(.96) } 100% { opacity: 1; transform: none } }
      @keyframes lp-marquee { from { transform: translateX(0) } to { transform: translateX(-50%) } }
      @keyframes lp-scan   { 0%,100% { top: 12% } 50% { top: 84% } }
      @keyframes lp-blink  { 0%,100% { opacity: 1 } 50% { opacity: .25 } }
      @keyframes lp-ring   { 0% { transform: scale(.8); opacity: .8 } 100% { transform: scale(2.2); opacity: 0 } }
      @keyframes lp-click  { 0% { transform: scale(.4); opacity: .9 } 100% { transform: scale(1.6); opacity: 0 } }
      @keyframes lp-draw   { from { stroke-dashoffset: 2000 } to { stroke-dashoffset: 0 } }

      .lp-bar { transform-origin: left; transform: scaleX(0); }
      .lp-in .lp-bar { animation: lp-grow .9s cubic-bezier(.22,1,.36,1) forwards; }
      .lp-row { opacity: 0; }
      .lp-in .lp-row { animation: lp-row .5s ease-out forwards; }
      .lp-pop { opacity: 0; }
      .lp-in .lp-pop { animation: lp-pop .6s cubic-bezier(.22,1,.36,1) forwards; }
      .lp-marquee { animation: lp-marquee 48s linear infinite; }
      .lp-marquee:hover { animation-play-state: paused; }
      .lp-scanline { animation: lp-scan 2.6s ease-in-out infinite; }
      .lp-blink { animation: lp-blink 1.1s steps(1) infinite; }
      .lp-ring { animation: lp-ring 1.8s ease-out infinite; }
      .lp-fade { animation: lp-pop .35s cubic-bezier(.22,1,.36,1); }
      .lp-click { animation: lp-click .5s ease-out forwards; }

      /* Botones con cuerpo (Frank, 20-oct: «más 3D, muy planos»): luz arriba, bisel y base de sombra; se hunden al pulsar. */
      .lp-btn-3d, .lp-btn-3d-ghost { position: relative; transition: transform .15s ease, box-shadow .15s ease, filter .15s ease; will-change: transform; }
      .lp-btn-3d {
        background: linear-gradient(180deg, #4f8df9 0%, #2563eb 55%, #1d4ed8 100%);
        box-shadow: inset 0 1px 0 rgba(255,255,255,.4), inset 0 -2px 0 rgba(0,0,0,.2), 0 6px 0 #1e3a8a, 0 16px 30px -10px rgba(37,99,235,.7);
      }
      .lp-btn-3d:hover { transform: translateY(-1px); filter: brightness(1.06); box-shadow: inset 0 1px 0 rgba(255,255,255,.4), inset 0 -2px 0 rgba(0,0,0,.2), 0 7px 0 #1e3a8a, 0 20px 34px -10px rgba(37,99,235,.75); }
      .lp-btn-3d:active { transform: translateY(4px); box-shadow: inset 0 1px 0 rgba(255,255,255,.3), inset 0 -1px 0 rgba(0,0,0,.2), 0 2px 0 #1e3a8a, 0 8px 16px -8px rgba(37,99,235,.6); }
      .lp-btn-3d-ghost {
        background: linear-gradient(180deg, rgba(255,255,255,.14) 0%, rgba(255,255,255,.05) 100%);
        border: 1px solid rgba(255,255,255,.18);
        box-shadow: inset 0 1px 0 rgba(255,255,255,.22), 0 5px 0 rgba(2,6,23,.9), 0 14px 24px -10px rgba(0,0,0,.8);
      }
      .lp-btn-3d-ghost:hover { transform: translateY(-1px); background: linear-gradient(180deg, rgba(255,255,255,.18) 0%, rgba(255,255,255,.07) 100%); box-shadow: inset 0 1px 0 rgba(255,255,255,.25), 0 6px 0 rgba(2,6,23,.9), 0 18px 28px -10px rgba(0,0,0,.8); }
      .lp-btn-3d-ghost:active { transform: translateY(3px); box-shadow: inset 0 1px 0 rgba(255,255,255,.2), 0 2px 0 rgba(2,6,23,.9), 0 6px 12px -8px rgba(0,0,0,.7); }
      .lp-draw { stroke-dasharray: 2000; stroke-dashoffset: 2000; animation: lp-draw 5s cubic-bezier(.22,1,.36,1) forwards; }

      /* Laptops bajas (≤ 820 px de alto): el hero sigue entrando en una pantalla. */
      @media (min-width: 1024px) and (max-height: 820px) {
        .lp-hero-h1 { font-size: 3.1rem !important; margin-bottom: 1rem !important; }
        .lp-hero-p  { font-size: .95rem !important; margin-bottom: 1.25rem !important; }
        .lp-hero    { padding-top: 5.5rem !important; padding-bottom: 2.5rem !important; }
        .lp-hero-promises { margin-top: 1.25rem !important; }
      }
      @media (prefers-reduced-motion: no-preference) {
        .lp-floaty      { animation: lp-floaty 5s ease-in-out infinite; }
        .lp-floaty-slow { animation: lp-floaty 7s ease-in-out 1.2s infinite; }
      }
      @media (prefers-reduced-motion: reduce) {
        .lp-bar, .lp-row, .lp-pop { opacity: 1; transform: none; animation: none !important; }
        .lp-marquee, .lp-scanline, .lp-blink, .lp-ring { animation: none !important; }
        .lp-draw { stroke-dashoffset: 0; animation: none !important; }
        .lp-particle { display: none; }
      }
    `}</style>
  )
}
