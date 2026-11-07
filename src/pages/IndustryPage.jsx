import { Link, Navigate, useParams } from 'react-router-dom'
import { ArrowRight, Check } from 'lucide-react'
import { Navbar, Footer, CtaBanner } from './LandingPage'
import { PageHero, usePublicPage } from './landing/site'
import { INDUSTRY_BY_SLUG, INDUSTRY_PAGES, industryPath } from './landing/industries'

/** /sistema-para/:slug — una página por rubro para que nos encuentren en Google. */
export default function IndustryPage() {
  const { slug } = useParams()
  const page = INDUSTRY_BY_SLUG[slug]
  usePublicPage({
    title: page?.title ?? 'Eazy Stock',
    description: page?.description ?? '',
    path: industryPath(slug),
  })
  if (!page) return <Navigate to="/para-quien" replace />
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Navbar />
      <PageHero kicker={page.name} title={page.heading} highlight={page.highlight} sub={page.sub}>
        <Link to="/registro" data-track={`industry_${page.slug}`}
          className="group inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-gray-900 hover:bg-slate-100">
          Crear mi cuenta gratis <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
        </Link>
      </PageHero>

      <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
        <div className="grid gap-4 md:grid-cols-3">
          {page.pains.map(([title, text]) => (
            <div key={title} className="rounded-2xl border border-gray-100 bg-gray-50/60 p-6">
              <h2 className="text-lg font-bold text-gray-900">{title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">{text}</p>
            </div>
          ))}
        </div>
        <h2 className="mt-14 text-2xl font-extrabold text-gray-900">También tienes</h2>
        <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {page.features.map((feature) => (
            <li key={feature} className="flex items-center gap-2.5 text-sm font-medium text-gray-700">
              <Check size={16} className="flex-shrink-0 text-emerald-500" /> {feature}
            </li>
          ))}
        </ul>
        <p className="mt-12 text-sm text-gray-500">
          Otros rubros:{' '}
          {INDUSTRY_PAGES.filter((p) => p.slug !== page.slug).map((p, i) => (
            <span key={p.slug}>{i > 0 && ' · '}<Link to={industryPath(p.slug)} className="font-semibold text-blue-600 hover:underline">{p.name}</Link></span>
          ))}
        </p>
      </section>
      <CtaBanner />
      <Footer />
    </div>
  )
}
