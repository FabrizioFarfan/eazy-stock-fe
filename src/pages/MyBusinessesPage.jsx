import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Store, Plus, LogIn, Check, Loader2, ShoppingCart, Wallet, HandCoins, Package, AlertTriangle, Users, Crown, Clock, Lock } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../context/AuthContext'
import { useMyBusinesses, useBusinessesOverview, useCreateBusiness } from '../hooks/useMyBusinesses'
import { useSubscription } from '../hooks/useSubscription'
import DateRangeQuick from '../components/common/DateRangeQuick'
import EntityModal, { EntityField } from '../components/common/EntityModal'
import { ReportHeader } from '../components/reports/ReportKit'
import { FlagAvatar, Chip } from '../components/boss/BossKit'
import { quickRange } from '../utils/dateRanges'
import { formatPrice, CURRENCIES, CURRENCY_OPTIONS, CURRENCY_BY_COUNTRY } from '../utils/formatMoney'
import { COUNTRIES } from '../utils/countries'
import { getErrorMessage } from '../utils/handleApiError'
import { formatDay } from '../components/subscription/subscriptionUtils'
import { PLANS } from './landing/plans'
import { useT, dateLocale } from '../i18n'
import { normalize as normalizeTaxId } from '../utils/taxIds'
import { taxIdLabel, taxIdHelp, checkTaxId, taxIdAlreadyRegisteredMessage } from '../utils/taxIdText'

/**
 * «Mis negocios» (M1 «Varios negocios por dueño», Frank 15-oct-2026), solo OWNER:
 * la SUMA TOTAL por moneda (ventas del período, nº de ventas, por cobrar, por pagar,
 * valor del stock al costo) y una tarjeta por negocio con sus números, «Entrar»
 * (cambia de negocio sin cerrar sesión) y «Nuevo negocio» (Basic = 1; Pro/AI =
 * ilimitados; si el plan no da, el BE responde PLAN_LIMIT y se manda a Tu plan).
 * Con un solo negocio la página sigue sirviendo: la suma es ese negocio.
 */

const inputCls = 'w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 placeholder-gray-400'
const num = (n) => Number(n ?? 0)
const fmtInt = (n) => num(n).toLocaleString(dateLocale())

function NewBusinessModal({ onClose, onCreated }) {
  const t = useT()
  const create = useCreateBusiness()
  const [limitHit, setLimitHit] = useState(false)
  const { register, handleSubmit, watch, setValue, setError, formState: { errors } } = useForm({
    defaultValues: { name: '', countryCode: 'PE', currency: 'PEN', phone: '', taxId: '' },
  })
  const name = watch('name')
  const country = watch('countryCode')
  useEffect(() => {
    const suggested = CURRENCY_BY_COUNTRY[country]
    if (suggested) setValue('currency', suggested)
  }, [country, setValue])

  const onSubmit = async (v) => {
    setLimitHit(false)
    try {
      const taxId = normalizeTaxId(v.taxId) ?? undefined
      const biz = await create.mutateAsync({
        name: v.name.trim(), countryCode: v.countryCode, currency: v.currency,
        phone: v.phone?.trim() || undefined,
        taxId,
      })
      toast.success(t('{name} ya está creado', { name: biz?.name ?? v.name }))
      onCreated?.(biz)
      onClose()
    } catch (err) {
      const code = err?.response?.data?.code
      if (code === 'PLAN_LIMIT') setLimitHit(true)
      else if (code === 'TAX_ID_ALREADY_REGISTERED') setError('taxId', { type: 'server', message: taxIdAlreadyRegisteredMessage(v.countryCode) })
      else if (err?.response?.data?.field === 'taxId') setError('taxId', { type: 'server', message: getErrorMessage(err) })
      else toast.error(getErrorMessage(err))
    }
  }

  return (
    <EntityModal onClose={onClose} onSubmit={handleSubmit(onSubmit)} isEdit={false}
      title={t('Nuevo negocio')} previewName={name} placeholderName={t('Nombre del negocio')}
      subtitle={t('Otra tienda bajo tu misma cuenta y tu mismo plan')}
      avatar={<FlagAvatar code={country} light />}
      submitting={create.isPending} submitLabel={t('Crear negocio')}>
      {limitHit && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <Crown size={16} className="mt-0.5 flex-shrink-0 text-amber-600" />
          <div>
            <p className="font-bold">{t('Tu plan admite un solo negocio')}</p>
            <p className="mt-0.5 text-xs">{t('Con el plan Pro tienes hasta 3 negocios y 20 trabajadores en esta misma cuenta; con AI, sin límite.')}</p>
            <Link to="/settings#plan" onClick={onClose} className="mt-1 inline-block text-xs font-bold text-amber-800 underline">{t('Ver mi plan')} →</Link>
          </div>
        </div>
      )}
      <EntityField label={t('Nombre del negocio')} error={errors.name?.message}>
        <input {...register('name', { required: t('Requerido'), maxLength: { value: 120, message: t('Máximo 120 caracteres') } })}
          type="text" autoFocus className={inputCls} placeholder={t('Bodega San Martín, sucursal centro…')} />
      </EntityField>
      <div className="grid grid-cols-2 gap-3">
        <EntityField label={t('País')}>
          <select {...register('countryCode')} className={inputCls}>
            {COUNTRIES.map(([code, label]) => <option key={code} value={code}>{t(label)}</option>)}
          </select>
        </EntityField>
        <EntityField label={t('Moneda')}>
          <select {...register('currency')} className={inputCls}>
            {CURRENCY_OPTIONS.map((code) => <option key={code} value={code}>{code} · {CURRENCIES[code].symbol}</option>)}
          </select>
        </EntityField>
      </div>
      {/* La explicación de la moneda, debajo: encima del campo lo bajaba y País y Moneda no quedaban a la par. */}
      <p className="-mt-2 text-xs text-gray-400">{t('Moneda')}: {t('Solo cambia el símbolo; no hay conversión')}</p>
      {/* Documento fiscal opcional, con la misma validación del registro (API 1.15.0). */}
      <EntityField label={`${taxIdLabel(country)} (${t('opcional')})`} error={errors.taxId?.message} hint={taxIdHelp(country)}>
        <input {...register('taxId', { validate: (raw) => checkTaxId(country, raw) ?? true })}
          type="text" inputMode={country === 'PE' ? 'numeric' : 'text'} autoComplete="off" className={inputCls}
          data-testid="new-business-tax-id" />
      </EntityField>
      <EntityField label={`${t('WhatsApp del negocio')} (${t('opcional')})`}>
        <input {...register('phone')} type="tel" autoComplete="tel" className={inputCls} placeholder="+51 999 999 999" />
      </EntityField>
    </EntityModal>
  )
}

/** Tarjeta grande de la suma total (una por moneda). */
function TotalsCard({ total, several, loading }) {
  const t = useT()
  const cur = total?.currency
  const cells = [
    { icon: ShoppingCart, label: t('Ventas del período'), value: formatPrice(total?.salesTotal, cur), sub: t('{n} ventas', { n: fmtInt(total?.salesCount) }) },
    { icon: Wallet,       label: t('Por cobrar'),         value: formatPrice(total?.receivablesOutstanding, cur), sub: t('fiado pendiente') },
    { icon: HandCoins,    label: t('Por pagar'),          value: formatPrice(total?.payablesOutstanding, cur), sub: t('a proveedores') },
    { icon: Package,      label: t('Stock al costo'),     value: formatPrice(total?.stockValueCost, cur), sub: t('lo que tienes en mercadería') },
  ]
  return (
    <div className="relative overflow-hidden rounded-2xl bg-blue-600 p-5 text-white shadow-md shadow-blue-600/30 sm:p-6">
      <div className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full bg-white/10" />
      <div className="pointer-events-none absolute -bottom-20 right-24 h-40 w-40 rounded-full bg-white/5" />
      <Store className="pointer-events-none absolute right-5 top-5 h-10 w-10 text-white/25 sm:h-12 sm:w-12" />
      <p className="relative text-xs font-semibold uppercase tracking-widest text-white/80">
        {several ? t('Suma total de tus negocios') : t('Tu negocio')}{cur ? ` · ${cur}` : ''}
      </p>
      {several && total?.businesses != null && (
        <p className="relative mt-1 text-xs text-white/80">{t('{n} negocios en {cur}', { n: total.businesses, cur })}</p>
      )}
      <div className="relative mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cells.map(({ icon: Icon, label, value, sub }) => (
          <div key={label} className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/15">
            <div className="flex items-center gap-2 text-white/80"><Icon size={14} /><p className="text-[11px] font-semibold uppercase tracking-wider">{label}</p></div>
            {loading
              ? <div className="mt-2 h-8 w-32 animate-pulse rounded-lg bg-white/20" />
              : <p className="mt-1 truncate text-2xl font-extrabold tracking-tight sm:text-3xl">{value}</p>}
            <p className="mt-0.5 text-xs text-white/70">{sub}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function BusinessCard({ biz, onEnter, entering }) {
  const t = useT()
  const cur = biz.currency
  const rows = [
    [ShoppingCart, t('Ventas'), formatPrice(biz.salesTotal, cur), t('{n} ventas', { n: fmtInt(biz.salesCount) })],
    [Wallet,       t('Por cobrar'), formatPrice(biz.receivablesOutstanding, cur), null],
    [HandCoins,    t('Por pagar'), formatPrice(biz.payablesOutstanding, cur), null],
    [Package,      t('Stock al costo'), formatPrice(biz.stockValueCost, cur), num(biz.lowStockCount) > 0 ? t('{n} con stock bajo', { n: biz.lowStockCount }) : null],
  ]
  return (
    <div className={`flex h-full flex-col overflow-hidden rounded-2xl border bg-white shadow-sm ${biz.current ? 'border-blue-200 ring-2 ring-blue-600/15' : 'border-gray-100'}`}>
      <div className="flex items-center gap-3 border-b border-gray-50 px-4 py-3.5">
        <FlagAvatar code={biz.countryCode} className="!h-11 !w-11" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate font-bold leading-tight text-gray-900">{biz.name}</p>
            {biz.current && <Chip icon={Check} tone="blue">{t('Estás aquí')}</Chip>}
            {/* Bajar de plan (API 1.16.0): se lee y se entra, pero no se escribe */}
            {biz.planLocked && <span data-testid="business-plan-locked"><Chip icon={Lock} tone="amber">{t('Solo lectura')}</Chip></span>}
          </div>
          <p className="mt-0.5 text-xs text-gray-400">
            {cur}{biz.employeesActive != null ? ` · ${t('{n} trabajadores', { n: biz.employeesActive })}` : ''}
            {biz.lastSaleAt ? ` · ${t('última venta')} ${formatDay(biz.lastSaleAt)}` : ` · ${t('sin ventas aún')}`}
          </p>
        </div>
      </div>
      <div className="grid flex-1 grid-cols-2 gap-px bg-gray-50">
        {rows.map(([Icon, label, value, sub]) => (
          <div key={label} className="bg-white px-4 py-3">
            <div className="flex items-center gap-1.5 text-gray-400"><Icon size={12} /><p className="text-[11px] font-semibold uppercase tracking-wider">{label}</p></div>
            <p className="mt-1 truncate text-lg font-extrabold tracking-tight text-gray-900">{value}</p>
            {sub && <p className={`text-xs ${sub.includes('stock') || sub.includes('low') ? 'text-amber-600' : 'text-gray-400'}`}>{sub}</p>}
          </div>
        ))}
      </div>
      <div className="border-t border-gray-50 p-3">
        {biz.current ? (
          <Link to="/dashboard" className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-50">
            {t('Ir al dashboard')}
          </Link>
        ) : (
          <button type="button" onClick={() => onEnter(biz)} disabled={!!entering}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm shadow-blue-600/30 transition-colors hover:bg-blue-700 disabled:opacity-60">
            {entering === biz.id ? <Loader2 size={15} className="animate-spin" /> : <LogIn size={15} />} {t('Entrar')}
          </button>
        )}
      </div>
    </div>
  )
}

export default function MyBusinessesPage() {
  const t = useT()
  const { user, switchBusiness } = useAuth()
  const [range, setRange] = useState(() => quickRange('month'))
  const [creating, setCreating] = useState(false)
  const [entering, setEntering] = useState(null)
  const { data: list } = useMyBusinesses()
  const { data: sub } = useSubscription()
  const { data, isLoading, isError } = useBusinessesOverview(range)

  const businesses = useMemo(() => {
    const fromOverview = data?.businesses ?? []
    // `planLocked` viene en /me/businesses (y quizá no en la vista general): se cruza por id.
    const lockedById = Object.fromEntries((Array.isArray(list) ? list : []).map((b) => [b.id, !!b.planLocked]))
    if (fromOverview.length > 0) return fromOverview.map((b) => ({ ...b, planLocked: b.planLocked ?? lockedById[b.id] ?? false }))
    // mientras carga la vista general, al menos los nombres
    return (Array.isArray(list) ? list : []).map((b) => ({ ...b, current: b.current || b.id === user?.businessId }))
  }, [data, list, user])
  const totals = data?.totals ?? []
  const several = businesses.length > 1
  const planName = PLANS.find((p) => p.key === String(sub?.plan ?? '').toLowerCase())?.name ?? sub?.plan
  const limitText = sub?.maxBusinesses == null
    ? t('Negocios ilimitados')
    : t('{n} de {max} negocios', { n: sub?.businessesCount ?? businesses.length, max: sub.maxBusinesses })

  const enter = async (biz) => {
    setEntering(biz.id)
    try {
      await switchBusiness(biz.id)
      toast.success(t('Ahora estás en {name}', { name: biz.name }))
    } catch (err) {
      toast.error(getErrorMessage(err))
      setEntering(null)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <ReportHeader icon={Store} title={t('Mis negocios')}
        subtitle={several ? t('Todas tus tiendas en una pantalla, con la suma total') : t('Tu tienda y, cuando quieras, las que vengan')}
        right={(
          <button type="button" onClick={() => setCreating(true)}
            className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-sm font-bold text-white shadow-sm shadow-blue-600/30 transition-colors hover:bg-blue-700">
            <Plus size={15} /> {t('Nuevo negocio')}
          </button>
        )} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <DateRangeQuick from={range.from} to={range.to} onChange={setRange} />
        {sub && (
          <Link to="/settings#plan" className="inline-flex items-center gap-2 self-start rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-50">
            <Crown size={13} className="text-amber-500" /> {planName} · {limitText}
          </Link>
        )}
      </div>

      {isError && (
        <div className="flex items-center gap-2 rounded-2xl border border-red-100 bg-red-50 px-4 py-4 text-sm text-red-600">
          <AlertTriangle size={16} /> {t('No se pudieron cargar los números. Intenta de nuevo en un momento.')}
        </div>
      )}

      {(totals.length > 0 || isLoading) && (
        <div className="flex flex-col gap-4">
          {(totals.length > 0 ? totals : [null]).map((tot, i) => (
            <TotalsCard key={tot?.currency ?? i} total={tot} several={several} loading={isLoading} />
          ))}
        </div>
      )}
      {several && totals.length > 1 && (
        <p className="-mt-2 flex items-center gap-1.5 text-xs text-gray-400"><Clock size={12} /> {t('Los totales van por moneda: no se suman soles con dólares.')}</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {businesses.map((b) => <BusinessCard key={b.id} biz={b} onEnter={enter} entering={entering} />)}
        <button type="button" onClick={() => setCreating(true)}
          className="flex min-h-[14rem] flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-gray-200 bg-white/60 p-6 text-center text-sm text-gray-500 transition-colors hover:border-blue-300 hover:bg-blue-50/40 hover:text-blue-700">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600"><Plus size={22} /></span>
          <span className="font-bold">{t('Nuevo negocio')}</span>
          <span className="text-xs text-gray-400">{sub?.maxBusinesses === 1 ? t('Con Pro, hasta 3') : t('Otra tienda bajo tu misma cuenta')}</span>
        </button>
      </div>

      {!several && (
        <div className="flex items-start gap-3 rounded-2xl border border-gray-100 bg-white px-5 py-4 text-sm text-gray-600 shadow-sm">
          <Users size={18} className="mt-0.5 flex-shrink-0 text-blue-600" />
          <p>{t('¿Abres otra tienda? Créala aquí y cambia entre ellas desde la barra de arriba sin cerrar sesión. Cada una con sus productos, su caja y sus trabajadores; aquí ves la suma.')}</p>
        </div>
      )}

      {creating && <NewBusinessModal onClose={() => setCreating(false)} />}
    </div>
  )
}
