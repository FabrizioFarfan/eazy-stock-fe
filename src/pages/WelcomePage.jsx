import { useNavigate } from 'react-router-dom'
import { FileSpreadsheet, MessageCircle, Zap, ArrowRight, Mail, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useProducts } from '../hooks/useProducts'
import { markCatalogDone } from '../utils/catalogDone'
import { useT } from '../i18n'

const SUPPORT_WHATSAPP = '4915511384643'
const SUPPORT_EMAIL = 'kontakt.eazylife@gmail.com'

/**
 * /bienvenida — «Carga tu catálogo» (Frank, 20-oct-2026, task 1014). Es lo
 * primero que ve una cuenta nueva: tres puertas para no quedarse mirando un
 * panel vacío. Sube tu Excel · Lo cargamos nosotros (foto del cuaderno, PDF
 * del proveedor o Excel por WhatsApp) · Empieza vendiendo (crear cada producto
 * al vuelo en la primera venta). Vuelve a estar a mano desde el Dashboard
 * mientras el catálogo esté vacío.
 */
export default function WelcomePage() {
  const t = useT()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data: anyProduct } = useProducts({ size: 1 })
  const total = anyProduct?.totalElements ?? 0

  const waMessage = t('Hola, soy {nombre} de {negocio}. Acabo de registrarme en Eazy Stock y quiero que me ayuden a cargar mis productos. Les mando lo que tengo:', {
    nombre: user?.name || '—',
    negocio: user?.businessName || '—',
  })
  const waHref = `https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent(waMessage)}`
  const mailHref = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(t('Ayuda para cargar mi inventario en Eazy Stock'))}&body=${encodeURIComponent(waMessage)}`

  const doors = [
    {
      key: 'excel', icon: FileSpreadsheet, tone: 'bg-emerald-50 text-emerald-600', badge: t('Minutos'),
      title: t('Sube tu Excel o CSV'),
      desc: t('El importador reconoce tus columnas, corrige tildes rotas y te muestra fila por fila qué va a entrar antes de guardar.'),
      cta: t('Importar mi lista'), onClick: () => navigate('/products/import'),
    },
    {
      key: 'us', icon: MessageCircle, tone: 'bg-blue-50 text-blue-600', badge: t('Sin esfuerzo'),
      title: t('Lo cargamos nosotros'),
      desc: t('Mándanos por WhatsApp la foto de tu cuaderno, el PDF de tu proveedor o tu Excel. Una persona del equipo lo carga y te avisa.'),
      cta: t('Escribir por WhatsApp'), href: waHref,
      extra: <a href={mailHref} className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-800"><Mail size={12} /> {t('o por correo a')} {SUPPORT_EMAIL}</a>,
    },
    {
      key: 'sell', icon: Zap, tone: 'bg-amber-50 text-amber-600', badge: t('Hoy mismo'),
      title: t('Empieza vendiendo'),
      desc: t('No cargues nada antes. En Nueva venta, lo que no exista lo creas al momento con nombre y precio, y el catálogo se arma solo con las ventas de la primera semana.'),
      cta: t('Ir a Nueva venta'), onClick: () => navigate('/sales/new'),
    },
  ]

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div className="relative overflow-hidden rounded-3xl bg-[#0a0e1a] px-6 py-8 text-white sm:px-10 sm:py-10">
        <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-blue-500/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" />
        <p className="relative text-xs font-semibold uppercase tracking-widest text-blue-300">{t('Bienvenido a Eazy Stock')}</p>
        <h1 className="relative mt-2 text-3xl font-extrabold leading-tight sm:text-4xl">
          {user?.businessName ? t('{negocio}, carguemos tu catálogo.', { negocio: user.businessName }) : t('Carguemos tu catálogo.')}
        </h1>
        <p className="relative mt-3 max-w-2xl text-sm text-slate-300 sm:text-base">
          {t('Es el único paso pesado, y tienes tres formas de hacerlo. Elige la que te resulte más fácil; puedes combinarlas.')}
        </p>
        <div className="relative mt-4 flex flex-wrap items-center gap-2">
          {total > 0 && (
            <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-emerald-300">
              <CheckCircle2 size={13} /> {t('Ya tienes {n} productos cargados', { n: total })}
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {doors.map(({ key, icon: Icon, tone, badge, title, desc, cta, onClick, href, extra }) => (
          <div key={key} className="flex flex-col rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${tone}`}><Icon size={22} /></span>
              <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-gray-600">{badge}</span>
            </div>
            <h2 className="mt-4 text-lg font-extrabold tracking-tight text-gray-900">{title}</h2>
            <p className="mt-1.5 flex-1 text-sm leading-relaxed text-gray-500">{desc}</p>
            {href ? (
              <a href={href} target="_blank" rel="noreferrer"
                className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow-sm shadow-blue-600/30 hover:bg-blue-700">
                {cta} <ArrowRight size={14} />
              </a>
            ) : (
              <button type="button" onClick={onClick}
                className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow-sm shadow-blue-600/30 hover:bg-blue-700">
                {cta} <ArrowRight size={14} />
              </button>
            )}
            {extra && <div className="mt-2 text-center">{extra}</div>}
          </div>
        ))}
      </div>

      {/* 28-oct (Frank): fuera el «Pronto: la IA arma los productos» (no existe todavía, task 941). En su lugar, cerrar
          este paso: el aviso «Primer paso» del panel deja de salir en este negocio. */}
      <div className="flex flex-col gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white text-emerald-600 ring-1 ring-emerald-200"><CheckCircle2 size={18} /></span>
          <div>
            <p className="font-bold text-gray-900">{t('¿Ya tienes tus productos cargados?')}</p>
            <p className="mt-0.5 text-sm text-gray-600">{t('Marca este paso como hecho y no volverá a aparecer en tu panel.')}</p>
          </div>
        </div>
        <button type="button" data-testid="welcome-catalog-done-bottom"
          onClick={() => { markCatalogDone(user?.businessId); navigate('/dashboard') }}
          className="inline-flex flex-shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-emerald-700">
          <CheckCircle2 size={15} /> {t('Listo, ya los tengo')}
        </button>
      </div>
    </div>
  )
}
