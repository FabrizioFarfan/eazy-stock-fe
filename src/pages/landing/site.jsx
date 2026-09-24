import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useT } from '../../i18n'
import { Reveal, GridPattern, GlowOrbs, LandingStyles } from './shared'
import { useNoAppDarkMode } from './useNoAppDarkMode'

/**
 * Piezas comunes de la web pública multipágina (25-sep-2026, pedido de Frank:
 * la landing de una sola página se veía amontonada). Cada página responde UNA
 * pregunta: Inicio (qué es), Funciones (qué hace), Para quién (me sirve),
 * Planes (cuánto cuesta), Preguntas (dudas). Navbar/Footer/CtaBanner siguen en
 * LandingPage.jsx.
 */

/** Rutas públicas: el prerender genera un HTML por cada una (scripts/prerender.mjs). */
export const PUBLIC_PAGES = [
  { to: '/funciones',  label: 'Funciones' },
  { to: '/para-quien', label: 'Para quién' },
  { to: '/planes',     label: 'Precios' },
  { to: '/preguntas',  label: 'Preguntas' },
]

/** Título, descripción y canonical de la página; se restauran al salir. */
export function usePageSeo({ title, description, path }) {
  useEffect(() => {
    const prevTitle = document.title
    const desc = document.querySelector('meta[name="description"]')
    const canon = document.querySelector('link[rel="canonical"]')
    const prevDesc = desc?.getAttribute('content')
    const prevCanon = canon?.getAttribute('href')
    document.title = title
    desc?.setAttribute('content', description)
    canon?.setAttribute('href', `https://eazy-stock.com${path}`)
    return () => {
      document.title = prevTitle
      if (prevDesc) desc?.setAttribute('content', prevDesc)
      if (prevCanon) canon?.setAttribute('href', prevCanon)
    }
  }, [title, description, path])
}

/** Arranque común de cada página pública: sin modo oscuro de la app y arriba del todo. */
export function usePublicPage(seo) {
  useNoAppDarkMode()
  usePageSeo(seo)
  const { hash, pathname } = useLocation()
  // Con #ancla (p. ej. /funciones#fiado desde el Inicio) se baja a esa parte;
  // si no, la página arranca arriba.
  useEffect(() => {
    if (!hash) { window.scrollTo(0, 0); return }
    const id = hash.slice(1)
    const go = () => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    const timer = setTimeout(go, 120)
    return () => clearTimeout(timer)
  }, [hash, pathname])
}

/** Cabecera oscura de las páginas internas: kicker + h1 en dos tonos + bajada. */
export function PageHero({ kicker, title, highlight, sub, children }) {
  return (
    <section className="relative overflow-hidden bg-[#0a0e1a] pb-20 pt-32 sm:pb-24 sm:pt-40">
      <LandingStyles />
      <GlowOrbs />
      <GridPattern />
      <div className="relative mx-auto max-w-5xl px-5 text-center sm:px-8">
        <Reveal>
          {kicker && (
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-blue-300">{kicker}</p>
          )}
          <h1 className="text-4xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl">
            {title}
            {highlight && (
              <>
                <br />
                <span className="bg-gradient-to-r from-blue-400 via-sky-300 to-amber-200 bg-clip-text text-transparent">{highlight}</span>
              </>
            )}
          </h1>
          {sub && <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-slate-400 sm:text-lg">{sub}</p>}
        </Reveal>
        {children && <Reveal delay={120} className="mt-10">{children}</Reveal>}
      </div>
    </section>
  )
}

/** Barra de secciones dentro de una página larga (Funciones): salta a cada bloque. */
export function SectionTabs({ items }) {
  const t = useT()
  return (
    <div className="sticky top-16 z-30 border-b border-gray-200 bg-white/90 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-5 py-2.5 sm:justify-center sm:px-8">
        {items.map(({ href, label, icon: Icon }) => (
          <a key={href} href={href}
            className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900">
            {Icon && <Icon size={14} />} {t(label)}
          </a>
        ))}
      </nav>
    </div>
  )
}
