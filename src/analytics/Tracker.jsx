import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { normalizePath, utmFrom, clickLabel } from '../utils/analytics'
import { canTrack, track } from './track'

/*
 * Analítica propia de la web pública (30-oct-2026): páginas vistas, botones, si se ven los precios y el envío
 * del registro. Sin cookies ni almacenamiento: cada evento va solo y el API cuenta visitantes con un hash
 * diario. No cuenta a quien tiene la sesión abierta (Frank, Fabrizio y los clientes dentro de la app) ni a quien
 * pide «no me sigas». No pinta nada.
 */

let firstHit = true
// La misma página dos veces seguidas (React en desarrollo monta dos veces) cuenta una.
let lastPageview = { key: '', at: 0 }

export default function AnalyticsTracker() {
  const { pathname, search } = useLocation()
  const pricingSeen = useRef(false)

  // Página vista. De dónde viene (referrer + utm) solo en la primera de la visita: luego el referrer es la propia web.
  useEffect(() => {
    if (!canTrack()) return
    const key = pathname + search
    if (lastPageview.key === key && Date.now() - lastPageview.at < 2000) return
    lastPageview = { key, at: Date.now() }
    const extra = firstHit ? { referrer: document.referrer || undefined, ...utmFrom(search) } : {}
    firstHit = false
    track('pageview', extra)
  }, [pathname, search])

  // Clics en lo que importa (ver clickLabel), escuchando en toda la página.
  useEffect(() => {
    const onClick = (e) => {
      const el = e.target?.closest?.('[data-track], a[href], button')
      if (!el) return
      const label = clickLabel({ track: el.getAttribute('data-track'), href: el.getAttribute('href') })
      if (label) track('click', { label })
    }
    document.addEventListener('click', onClick, true)
    return () => document.removeEventListener('click', onClick, true)
  }, [])

  // ¿Llegó a ver los precios de la portada? Una vez por carga de página.
  useEffect(() => {
    if (normalizePath(pathname) !== '/' || pricingSeen.current || typeof IntersectionObserver === 'undefined') return
    let io
    const timer = setTimeout(() => {
      const section = document.getElementById('precios')
      if (!section) return
      io = new IntersectionObserver((entries) => {
        if (entries.some((en) => en.isIntersecting) && !pricingSeen.current) {
          pricingSeen.current = true
          track('pricing_view')
          io.disconnect()
        }
      }, { threshold: 0.35 })
      io.observe(section)
    }, 800)
    return () => { clearTimeout(timer); io?.disconnect() }
  }, [pathname])

  return null
}
