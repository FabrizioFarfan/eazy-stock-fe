import { useT } from '../i18n'
import { Navbar, Footer, CtaBanner } from './LandingPage'
import { usePublicPage } from './landing/site'
import AppsTesters from './landing/AppsTesters'

const QUESTIONS = [
  ['¿Cuesta algo?', 'No. La prueba es gratis y no te pedimos tarjeta.'],
  ['¿Qué tengo que hacer?', 'Instalar la app con el enlace que te mandamos, usarla un poco durante 14 días y contarnos qué falla.'],
  ['¿Necesito tener un negocio?', 'No hace falta. Si tienes uno, mejor, porque la pruebas con tus productos de verdad.'],
  ['¿Y cuando salga?', 'Te quedas con la app y tienes 3 meses gratis del plan Pro, por ayudarnos.'],
]

/** /apps — el enlace para compartir: las apps en fase de prueba y el correo para entrar como tester. */
export default function AppsPage() {
  const t = useT()
  usePublicPage({
    title: t('Apps de Eazy Stock para Android y iPhone: pruébalas gratis'),
    description: t('La app de Eazy Stock para Android y iPhone está en fase de prueba. Déjanos tu correo, pruébala gratis y llévate 3 meses del plan Pro cuando salga.'),
    path: '/apps',
  })
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Navbar />
      <div className="bg-[#0a0e1a] pt-16"><AppsTesters pageTitle /></div>
      <section className="mx-auto max-w-3xl px-5 py-16 sm:px-8">
        <h2 className="text-2xl font-extrabold text-gray-900">{t('Lo que nos suelen preguntar')}</h2>
        <dl className="mt-6 divide-y divide-gray-100">
          {QUESTIONS.map(([q, a]) => (
            <div key={q} className="py-4">
              <dt className="font-semibold text-gray-900">{t(q)}</dt>
              <dd className="mt-1 text-sm leading-relaxed text-gray-600">{t(a)}</dd>
            </div>
          ))}
        </dl>
      </section>
      <CtaBanner />
      <Footer />
    </div>
  )
}
