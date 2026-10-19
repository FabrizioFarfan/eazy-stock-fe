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
      className={`absolute inset-0 ${light ? 'opacity-[0.05]' : 'opacity-[0.08]'}`}
      style={{
        backgroundImage: `linear-gradient(${line} 1px, transparent 1px), linear-gradient(90deg, ${line} 1px, transparent 1px)`,
        backgroundSize: '36px 36px',
        maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 80%)',
        WebkitMaskImage: 'radial-gradient(ellipse at center, black 30%, transparent 80%)',
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
 * Fondo del hero: brillo azul + SVG animado (como en Eazy Finance y Eazy Habit):
 * anillos punteados que giran despacio, una cuadrícula en perspectiva y
 * «estantes» que se dibujan solos. Todo decorativo y en una sola tinta.
 */
export function HeroBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute left-1/2 top-1/2 h-[60rem] w-[60rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-600/[0.13] blur-[160px]" />
      <div className="absolute -right-40 top-1/3 h-[34rem] w-[34rem] rounded-full bg-blue-500/10 blur-[140px]" />
      <svg className="lp-backdrop absolute inset-0 h-full w-full" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" fill="none">
        <defs>
          <radialGradient id="lpb-fade" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="#fff" stopOpacity="1" />
            <stop offset="70%" stopColor="#fff" stopOpacity=".9" />
            <stop offset="100%" stopColor="#fff" stopOpacity=".3" />
          </radialGradient>
          <mask id="lpb-mask"><rect width="1440" height="900" fill="url(#lpb-fade)" /></mask>
          <filter id="lpb-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.5" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <g mask="url(#lpb-mask)" stroke="rgba(147,197,253,.75)" strokeWidth="1.5" filter="url(#lpb-glow)">
          {/* halo de anillos alrededor de la ventana del producto, con satélites */}
          <g className="lp-spin-slow" style={{ transformOrigin: '1010px 470px' }}>
            <circle cx="1010" cy="470" r="470" strokeDasharray="4 12" />
            <circle cx="1480" cy="470" r="5" fill="#93c5fd" stroke="none" />
          </g>
          <g className="lp-spin-rev" style={{ transformOrigin: '1010px 470px' }}>
            <circle cx="1010" cy="470" r="395" strokeDasharray="3 9" strokeOpacity=".85" />
            <circle cx="615" cy="470" r="4" fill="#bfdbfe" stroke="none" />
          </g>
          <g className="lp-spin" style={{ transformOrigin: '1010px 470px' }}>
            <circle cx="1010" cy="470" r="320" strokeDasharray="2 6" strokeOpacity=".8" />
            <circle cx="1010" cy="150" r="4" fill="#60a5fa" stroke="none" />
          </g>
          {/* línea de ventas que sube, encima del titular */}
          <path className="lp-draw" d="M70 215 L200 180 L310 200 L430 130 L560 150 L690 70" strokeOpacity=".9" strokeLinecap="round" strokeLinejoin="round" />
          {[[200, 180], [310, 200], [430, 130], [560, 150]].map(([x, y]) => (
            <circle key={x} cx={x} cy={y} r="3" fill="#93c5fd" stroke="none" />
          ))}
          <circle cx="690" cy="70" r="5" fill="#60a5fa" stroke="none" className="lp-pulse-dot" />
          {/* estantes isométricos en las esquinas libres */}
          <g className="lp-draw" strokeLinecap="round" strokeOpacity=".8" style={{ animationDelay: '.8s' }}>
            <path d="M130 800 L300 725 L470 800 L300 875 Z" />
            <path d="M130 800 L130 850 L300 925 L470 850 L470 800" />
            <path d="M300 875 L300 925" />
            <path d="M190 760 L190 810 M410 760 L410 810" strokeOpacity=".5" />
          </g>
          <g className="lp-draw" strokeLinecap="round" strokeOpacity=".7" style={{ animationDelay: '1.4s' }}>
            <path d="M1200 120 L1310 70 L1420 120 L1310 170 Z" />
            <path d="M1200 120 L1200 160 L1310 210 L1420 160 L1420 120" />
            <path d="M1310 170 L1310 210" />
          </g>
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
      @keyframes lp-spin   { to { transform: rotate(360deg) } }
      @keyframes lp-draw   { from { stroke-dashoffset: 1200 } to { stroke-dashoffset: 0 } }
      @keyframes lp-pulse-dot { 0%,100% { opacity: 1; r: 4 } 50% { opacity: .4; r: 7 } }

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
      .lp-spin-slow { animation: lp-spin 140s linear infinite; }
      .lp-spin-rev  { animation: lp-spin 95s linear infinite reverse; }
      .lp-spin      { animation: lp-spin 60s linear infinite; }
      .lp-draw { stroke-dasharray: 1200; stroke-dashoffset: 1200; animation: lp-draw 6s cubic-bezier(.22,1,.36,1) forwards; }
      .lp-pulse-dot { animation: lp-pulse-dot 2.4s ease-in-out infinite; }

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
        .lp-marquee, .lp-scanline, .lp-blink, .lp-ring, .lp-spin-slow, .lp-spin-rev, .lp-spin, .lp-pulse-dot { animation: none !important; }
        .lp-draw { stroke-dashoffset: 0; animation: none !important; }
      }
    `}</style>
  )
}
