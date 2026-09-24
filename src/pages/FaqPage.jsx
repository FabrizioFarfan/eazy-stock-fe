import { Mail, MessageCircle } from 'lucide-react'
import { useT } from '../i18n'
import { Navbar, Footer, CtaBanner, Faq, ComingSoon } from './LandingPage'
import { PageHero, usePublicPage } from './landing/site'
import { Reveal } from './landing/shared'

/** /preguntas — las dudas antes de registrarse, lo que viene y cómo escribirnos. */
export default function FaqPage() {
  const t = useT()
  usePublicPage({
    title: t('Preguntas frecuentes — Eazy Stock'),
    description: t('Cuánto cuesta Eazy Stock, si hay que instalar algo, cómo se sube el Excel, cómo se controla el fiado, qué ven los empleados y qué viene después.'),
    path: '/preguntas',
  })
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Navbar />
      <PageHero
        kicker={t('Preguntas')}
        title={t('Lo que todos preguntan')}
        highlight={t('antes de empezar.')}
        sub={t('Si tu duda no está aquí, escríbenos: respondemos nosotros, no un robot.')}
      />
      <Faq head={false} />
      <section className="bg-white pb-8 pt-4">
        <div className="mx-auto max-w-3xl px-5 sm:px-8">
          <Reveal>
            <div className="flex flex-col items-center gap-4 rounded-3xl border border-gray-200 bg-gray-50 p-6 text-center sm:flex-row sm:text-left">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md">
                <MessageCircle size={22} />
              </div>
              <div className="flex-1">
                <p className="text-base font-bold text-gray-900">{t('¿Te quedó una duda?')}</p>
                <p className="text-sm text-gray-500">{t('Escríbenos y te respondemos lo antes posible.')}</p>
              </div>
              <a href="mailto:kontakt.eazylife@gmail.com" className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-gray-900 shadow-sm ring-1 ring-gray-200 hover:bg-gray-100">
                <Mail size={15} /> kontakt.eazylife@gmail.com
              </a>
            </div>
          </Reveal>
        </div>
      </section>
      <ComingSoon />
      <CtaBanner />
      <Footer />
    </div>
  )
}
