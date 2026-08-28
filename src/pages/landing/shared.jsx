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

export function GlowOrbs() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-blue-600/30 blur-[120px]" />
      <div className="absolute right-0 top-1/3 h-96 w-96 rounded-full bg-indigo-500/20 blur-[120px]" />
      <div className="absolute bottom-0 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-amber-400/10 blur-[140px]" />
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
      <h2 className={`text-3xl font-extrabold leading-[1.1] tracking-tight sm:text-4xl lg:text-[2.75rem] ${dark ? 'text-white' : 'text-gray-900'}`}>
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
      @keyframes lp-floaty { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-8px) } }
      @keyframes lp-grow   { from { transform: scaleX(0) } to { transform: scaleX(1) } }
      @keyframes lp-row    { from { opacity: 0; transform: translateX(-8px) } to { opacity: 1; transform: none } }
      @keyframes lp-pop    { 0% { opacity: 0; transform: translateY(10px) scale(.96) } 100% { opacity: 1; transform: none } }
      @keyframes lp-marquee { from { transform: translateX(0) } to { transform: translateX(-50%) } }
      @keyframes lp-scan   { 0%,100% { top: 12% } 50% { top: 84% } }
      @keyframes lp-blink  { 0%,100% { opacity: 1 } 50% { opacity: .25 } }
      @keyframes lp-ring   { 0% { transform: scale(.8); opacity: .8 } 100% { transform: scale(2.2); opacity: 0 } }

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

      @media (prefers-reduced-motion: no-preference) {
        .lp-floaty      { animation: lp-floaty 5s ease-in-out infinite; }
        .lp-floaty-slow { animation: lp-floaty 7s ease-in-out 1.2s infinite; }
      }
      @media (prefers-reduced-motion: reduce) {
        .lp-bar, .lp-row, .lp-pop { opacity: 1; transform: none; animation: none !important; }
        .lp-marquee, .lp-scanline, .lp-blink, .lp-ring { animation: none !important; }
      }
    `}</style>
  )
}
