import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { useT } from '../i18n'
import { Navbar, Footer, CtaBanner, Benefits, Industries, HowItWorks, Testimonial } from './LandingPage'
import { PageHero, usePublicPage } from './landing/site'

const CTA = '/login'

/** /para-quien — ¿me sirve? Los beneficios con su antes y ahora, y los rubros. */
export default function AudiencePage() {
  const t = useT()
  usePublicPage({
    title: t('Para quién es — Eazy Stock'),
    description: t('Eazy Stock sirve a ferreterías, bodegas, farmacias, distribuidoras y abarrotes: la caja cuadra, el fiado se cobra, no te quedas sin stock y tu equipo vende mientras tú controlas.'),
    path: '/para-quien',
  })
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Navbar />
      <PageHero
        kicker={t('Para quién')}
        title={t('Hecho para el que atiende')}
        highlight={t('el mostrador.')}
        sub={t('No es un ERP para contadores. Es para el dueño que vende, cobra y fía todos los días, y quiere saber cuánto ganó sin abrir un cuaderno.')}
      >
        <Link to={CTA} className="group inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-[#0a0e1a] hover:bg-blue-50">
          {t('Probar gratis')} <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
        </Link>
      </PageHero>
      <Benefits />
      <Industries />
      <Testimonial />
      <HowItWorks />
      <CtaBanner />
      <Footer />
    </div>
  )
}
