import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { useT } from '../i18n'
import { Navbar, Footer, CtaBanner, Benefits, Industries, HowItWorks, OriginStory } from './LandingPage'
import { PageHero, usePublicPage } from './landing/site'
import { INDUSTRY_PAGES, industryPath } from './landing/industries'

const CTA = '/registro'

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
      <nav aria-label={t('Por rubro')} className="mx-auto flex max-w-5xl flex-wrap justify-center gap-2 px-5 pb-12">
        {INDUSTRY_PAGES.map((p) => (
          <Link key={p.slug} to={industryPath(p.slug)} className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
            {t('Sistema para {rubro}', { rubro: p.name.toLowerCase() })}
          </Link>
        ))}
      </nav>
      <OriginStory />
      <HowItWorks />
      <CtaBanner />
      <Footer />
    </div>
  )
}
