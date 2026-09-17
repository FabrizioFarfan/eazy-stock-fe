import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ChevronDown, Check, Store, Users, Sparkles } from 'lucide-react'
import { useT } from '../i18n'
import { Reveal, SectionHead, GridPattern, GlowOrbs, LandingStyles } from './landing/shared'
import { PlanCards, OffersGrid, CompareTable } from './landing/Pricing'
import { PLAN_FAQS, TRIAL_DAYS } from './landing/plans'
import { Navbar, Footer, CtaBanner } from './LandingPage'
import { useNoAppDarkMode } from './landing/useNoAppDarkMode'

const CTA = '/login'

/**
 * /planes — página pública de PLANES Y OFERTAS (17-sep-2026, plan M1).
 * Misma piel que la landing (navbar transparente sobre cabecera oscura,
 * secciones claras alternadas, CTA final oscuro). Los números viven en
 * landing/plans.js: aquí solo se pintan.
 */
function useSeo() {
  const t = useT()
  useEffect(() => {
    const prevTitle = document.title
    const desc = document.querySelector('meta[name="description"]')
    const canon = document.querySelector('link[rel="canonical"]')
    const prevDesc = desc?.getAttribute('content')
    const prevCanon = canon?.getAttribute('href')
    document.title = t('Planes y precios — Eazy Stock')
    desc?.setAttribute('content', t('Planes Basic, Pro y AI de Eazy Stock: desde 1 negocio y 5 trabajadores hasta negocios ilimitados con inteligencia artificial. Gratis durante el lanzamiento, {days} días de prueba sin tarjeta.', { days: TRIAL_DAYS }))
    canon?.setAttribute('href', 'https://eazy-stock.com/planes')
    return () => {
      document.title = prevTitle
      if (prevDesc) desc?.setAttribute('content', prevDesc)
      if (prevCanon) canon?.setAttribute('href', prevCanon)
    }
  }, [t])
}

function FaqItem({ q, a, open, onToggle }) {
  return (
    <div className={`overflow-hidden rounded-2xl border bg-white transition-all ${open ? 'border-blue-200 shadow-lg shadow-blue-50' : 'border-gray-200'}`}>
      <button type="button" onClick={onToggle} className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left" aria-expanded={open}>
        <span className="text-sm font-bold text-gray-900 sm:text-base">{q}</span>
        <ChevronDown size={18} className={`flex-shrink-0 text-gray-400 transition-transform duration-300 ${open ? 'rotate-180 text-blue-600' : ''}`} />
      </button>
      <div className={`grid transition-all duration-300 ease-in-out ${open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="overflow-hidden"><p className="px-6 pb-5 text-sm leading-relaxed text-gray-600">{a}</p></div>
      </div>
    </div>
  )
}

export default function PlansPage() {
  const t = useT()
  const [openIdx, setOpenIdx] = useState(0)
  useNoAppDarkMode()
  useSeo()
  useEffect(() => { window.scrollTo(0, 0) }, [])

  const steps = [
    [Users,    'Elige tu plan',            'Basic para una tienda, Pro para varias, AI si quieres que la inteligencia artificial trabaje contigo.'],
    [Store,    'Prueba {days} días gratis', 'Sin tarjeta. Sube tu Excel, vende, cierra la caja: la prueba es con tu negocio real.'],
    [Sparkles, 'Cambia cuando quieras',    'Subes o bajas de plan desde Ajustes. Tus datos no se tocan nunca.'],
  ]

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <LandingStyles />
      <Navbar home={false} />

      {/* Cabecera oscura con las tarjetas */}
      <section className="relative overflow-hidden bg-[#0a0e1a] pb-24 pt-28 sm:pt-36">
        <GlowOrbs />
        <GridPattern />
        <div className="relative mx-auto max-w-6xl px-5 sm:px-8">
          <Reveal className="mb-12 text-center">
            <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-semibold text-slate-200 backdrop-blur">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              {t('Gratis durante el lanzamiento')}
            </span>
            <h1 className="text-4xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl">
              {t('Planes y precios')}<br />
              <span className="bg-gradient-to-r from-blue-400 via-sky-300 to-amber-200 bg-clip-text text-transparent">{t('claros como tu caja.')}</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base text-slate-400 sm:text-lg">
              {t('Pagas por el tamaño de tu negocio, no por funciones escondidas. Todo lo que hace Eazy Stock está en todos los planes; lo que cambia es cuántas tiendas, cuánta gente y si la IA trabaja contigo.')}
            </p>
          </Reveal>
          <PlanCards dark />
        </div>
      </section>

      {/* Comparativa */}
      <section id="comparar" className="bg-white py-24">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <Reveal>
            <SectionHead kicker={t('Compara')} title={t('Lo que incluye cada plan')} sub={t('Sin letra chica: la misma app para todos, con límites distintos.')} />
          </Reveal>
          <Reveal delay={100}><CompareTable /></Reveal>
        </div>
      </section>

      {/* Ofertas */}
      <section id="ofertas" className="bg-gray-50 py-24">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <Reveal>
            <SectionHead kicker={t('Ofertas vigentes')} title={t('Entrar temprano tiene premio')} kickerColor="text-amber-600" />
          </Reveal>
          <OffersGrid />
        </div>
      </section>

      {/* Cómo funciona el plan */}
      <section className="bg-white py-24">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <Reveal><SectionHead kicker={t('Cómo funciona')} title={t('Tres pasos y listo')} /></Reveal>
          <div className="relative grid gap-10 md:grid-cols-3">
            <div className="absolute left-0 right-0 top-12 hidden h-0.5 bg-gradient-to-r from-transparent via-blue-300 to-transparent md:block" />
            {steps.map(([Icon, title, desc], i) => (
              <Reveal key={title} delay={i * 130} className="relative flex flex-col items-center text-center">
                <div className="relative mb-5 flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-xl shadow-blue-200">
                  <Icon size={34} className="text-white" />
                  <span className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-[#0a0e1a] text-xs font-extrabold text-blue-300 ring-4 ring-white">{String(i + 1).padStart(2, '0')}</span>
                </div>
                <h3 className="mb-2 text-lg font-bold text-gray-900">{t(title, { days: TRIAL_DAYS })}</h3>
                <p className="text-sm leading-relaxed text-gray-500">{t(desc)}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ de planes */}
      <section id="faq-planes" className="bg-gray-50 py-24">
        <div className="mx-auto max-w-3xl px-5 sm:px-8">
          <Reveal><SectionHead kicker={t('Preguntas sobre los planes')} title={t('Antes de elegir')} /></Reveal>
          <Reveal delay={100}>
            <div className="space-y-3">
              {PLAN_FAQS.map(([q, a], i) => (
                <FaqItem key={q} q={t(q, { days: TRIAL_DAYS })} a={t(a, { days: TRIAL_DAYS })} open={openIdx === i} onToggle={() => setOpenIdx(openIdx === i ? -1 : i)} />
              ))}
            </div>
          </Reveal>
          <Reveal delay={150} className="mt-10 text-center">
            <Link to={CTA} className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-200 transition-all hover:scale-[1.02]">
              {t('Probar gratis')} <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
            <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-gray-500"><Check size={12} className="text-emerald-500" /> {t('Sin tarjeta, sin instalar nada')}</p>
          </Reveal>
        </div>
      </section>

      <CtaBanner />
      <Footer home={false} />
    </div>
  )
}
