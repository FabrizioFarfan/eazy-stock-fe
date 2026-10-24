import { Link } from 'react-router-dom'
import { CalendarClock, Mail, Monitor, RotateCcw, Smartphone, Store, Trash2, User } from 'lucide-react'
import { useT } from '../i18n'
import { Navbar, Footer } from './LandingPage'
import { PageHero, usePublicPage } from './landing/site'
import { Reveal } from './landing/shared'

const EMAIL = 'kontakt.eazylife@gmail.com'

function Card({ icon: Icon, title, children }) {
  return (
    <div className="flex h-full flex-col rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600"><Icon size={20} /></span>
      <h3 className="mt-4 text-base font-bold text-gray-900">{title}</h3>
      <div className="mt-2 space-y-2 text-[15px] leading-relaxed text-gray-600">{children}</div>
    </div>
  )
}

function Block({ title, children }) {
  return (
    <div>
      <h2 className="mb-4 text-xl font-extrabold tracking-tight text-gray-900 sm:text-2xl">{title}</h2>
      {children}
    </div>
  )
}

const Path = ({ children }) => <span className="font-semibold text-gray-900">{children}</span>

/**
 * /eliminar-cuenta (24-oct-2026, API 1.14.0) — la página pública que pide Google Play
 * para el borrado de cuenta: cómo pedirlo (app, web o correo), qué se borra, en cuánto
 * tiempo (30 días) y cómo cancelarlo (volver a entrar). Sin sesión y prerenderizada.
 */
export default function DeleteAccountInfoPage() {
  const t = useT()
  usePublicPage({
    title: t('Eliminar tu cuenta — Eazy Stock'),
    description: t('Cómo pedir el borrado de tu cuenta de Eazy Stock desde la app, la web o por correo, qué datos se borran, en cuánto tiempo y cómo cancelarlo.'),
    path: '/eliminar-cuenta',
  })
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Navbar />
      <PageHero
        kicker={t('Tu cuenta')}
        title={t('Cómo eliminar tu cuenta')}
        highlight={t('de Eazy Stock.')}
        sub={t('Lo pides tú, en un minuto. Se borra a los 30 días y, hasta entonces, puedes arrepentirte.')}
      />

      <section className="bg-white py-14 sm:py-20">
        <div className="mx-auto max-w-5xl space-y-16 px-5 sm:px-8">
          <Reveal>
            <Block title={t('1. Cómo pedirlo')}>
              <div className="grid gap-4 md:grid-cols-3">
                <Card icon={Smartphone} title={t('Desde la app')}>
                  <p>{t('Abre Eazy Stock y ve a')} <Path>{t('Ajustes › Eliminar mi cuenta')}</Path>. {t('Escribe tu contraseña para confirmar.')}</p>
                </Card>
                <Card icon={Monitor} title={t('Desde la web')}>
                  <p>
                    <Link to="/login" className="font-semibold text-blue-600 hover:underline">{t('Entra a tu cuenta')}</Link>{' '}
                    {t('y ve a')} <Path>{t('Ajustes › Eliminar mi cuenta')}</Path>. {t('Escribe tu contraseña para confirmar.')}
                  </p>
                </Card>
                <Card icon={Mail} title={t('Por correo')}>
                  <p>{t('Si no puedes entrar, escríbenos desde el correo de tu cuenta a')}{' '}
                    <a href={`mailto:${EMAIL}?subject=${encodeURIComponent(t('Eliminar mi cuenta de Eazy Stock'))}`} className="break-all font-semibold text-blue-600 hover:underline">{EMAIL}</a>.{' '}
                    {t('Te respondemos para confirmarlo.')}
                  </p>
                </Card>
              </div>
            </Block>
          </Reveal>

          <Reveal>
            <Block title={t('2. Qué se borra')}>
              <div className="grid gap-4 md:grid-cols-2">
                <Card icon={Store} title={t('Si eres el dueño del negocio')}>
                  <p>{t('Se borran tu cuenta y tu negocio con todos sus datos: productos, stock, ventas, clientes, fiado, proveedores y empleados. Si tienes más negocios, también.')}</p>
                  <p>{t('Tu suscripción deja de renovarse y no se te vuelve a cobrar. Tus empleados dejan de poder entrar.')}</p>
                </Card>
                <Card icon={User} title={t('Si eres empleado')}>
                  <p>{t('Se borra solo tu usuario y tu correo queda libre. Las ventas que hiciste se quedan en el negocio, porque son del negocio.')}</p>
                </Card>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-gray-500">
                {t('Solo guardamos lo que la ley nos obliga a conservar, como los registros de pagos de la suscripción. Si quieres quedarte con tus productos, expórtalos a Excel antes de pedir el borrado.')}
              </p>
            </Block>
          </Reveal>

          <Reveal>
            <div className="grid gap-4 md:grid-cols-2">
              <Card icon={CalendarClock} title={t('3. En cuánto tiempo: 30 días')}>
                <p>{t('Al pedirlo se cierra tu sesión y la cuenta queda en pausa: nadie puede usarla. Te mandamos un correo con la fecha exacta del borrado.')}</p>
                <p>{t('A los 30 días se borra para siempre y ya no se puede recuperar.')}</p>
              </Card>
              <Card icon={RotateCcw} title={t('4. Cómo cancelarlo')}>
                <p>{t('Vuelve a entrar con tu correo y contraseña antes de que pasen los 30 días: la cuenta se reactiva sola y todo queda como estaba.')}</p>
                <p>{t('Si eras el dueño, tu suscripción vuelve a renovarse y recuperas tu plan tal como estaba.')}</p>
              </Card>
            </div>
          </Reveal>

          <Reveal>
            <div className="flex flex-col items-center gap-4 rounded-3xl border border-gray-200 bg-gray-50 p-6 text-center sm:flex-row sm:text-left">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-500">
                <Trash2 size={22} />
              </div>
              <div className="flex-1">
                <p className="text-base font-bold text-gray-900">{t('¿Dudas sobre tus datos?')}</p>
                <p className="text-sm text-gray-500">
                  {t('Escríbenos o lee nuestra')}{' '}
                  <Link to="/datenschutz" className="font-semibold text-blue-600 hover:underline">{t('Política de privacidad')}</Link>.
                </p>
              </div>
              <a href={`mailto:${EMAIL}`} className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-gray-900 shadow-sm ring-1 ring-gray-200 hover:bg-gray-100">
                <Mail size={15} /> {EMAIL}
              </a>
            </div>
          </Reveal>
        </div>
      </section>
      <Footer />
    </div>
  )
}
