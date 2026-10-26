import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { CreditCard, Search, MessageCircle, Mail, CalendarPlus, Clock, Pencil, Loader2, RefreshCw, Filter, Store, Tag, X } from 'lucide-react'
import { toast } from 'sonner'
import { useBossSubscriptions, useUpdateSubscription, useMarkPaid, useExtendTrial, useSetCoupon } from '../../hooks/useSubscription'
import EntityModal, { EntityField } from '../../components/common/EntityModal'
import { ReportHeader, ReportHero, BigSearch } from '../../components/reports/ReportKit'
import { BossSwitcher, FlagAvatar, Chip } from '../../components/boss/BossKit'
import { getErrorMessage } from '../../utils/handleApiError'
import { couponPayload } from '../../utils/billingFlow'
import { whatsappDigits } from '../../utils/phone'
import { CURRENCY, PLANS, fmtMoney } from '../landing/plans'
import { formatDay, STATUS_TONE, STATUS_LABEL } from '../../components/subscription/subscriptionUtils'
import { useT } from '../../i18n'

/**
 * Boss › Suscripciones (M1 «Planes en serio», 15-oct-2026): una fila por DUEÑO (la
 * suscripción es de la cuenta; sus negocios se listan en la fila) con su prueba,
 * plan, estado y precio; acciones rápidas «Marcar pagado +1 mes» y
 * «Extender prueba +7 días» (hasta que llegue la pasarela, el cobro es manual) y
 * un modal para tocar plan, estado, fechas, descuento y nota.
 * Web 1.24.0 (API 1.17.0, STRIPE-SPEC.md §3): fuera el precio especial; el descuento con tarjeta es
 * un «Cupón de Stripe» (id) que se aplica o quita aparte con PUT /boss/subscriptions/{id}/coupon.
 */

const PLAN_KEYS = ['BASIC', 'PRO', 'AI']
const STATUSES = ['TRIAL', 'ACTIVE', 'PAST_DUE', 'EXPIRED', 'CANCELED']
const inputCls = 'w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 placeholder-gray-400'

const fmt = (n) => (n == null ? '—' : Number(n).toLocaleString('es-PE', { maximumFractionDigits: 0 }))
const toDateInput = (iso) => (iso ? String(iso).slice(0, 10) : '')
const planName = (key) => PLANS.find((p) => p.key === String(key ?? '').toLowerCase())?.name ?? key

function EditSubscriptionModal({ row, onClose }) {
  const t = useT()
  const update = useUpdateSubscription()
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      plan: row.plan ?? 'BASIC',
      status: row.status ?? 'TRIAL',
      trialEndsAt: toDateInput(row.trialEndsAt),
      paidUntil: toDateInput(row.paidUntil),
      discountPercent: row.discountPercent ?? 0,
      discountUntil: toDateInput(row.discountUntil),
      launchPriceLocked: !!row.launchPriceLocked,
      founder: !!row.founder,
      note: row.note ?? '',
    },
  })

  const onSubmit = async (v) => {
    const data = {
      plan: v.plan,
      status: v.status,
      trialEndsAt: v.trialEndsAt || null,
      paidUntil: v.paidUntil || null,
      discountPercent: v.discountPercent === '' ? 0 : Number(v.discountPercent),
      discountUntil: v.discountUntil || null,
      launchPriceLocked: !!v.launchPriceLocked,
      founder: !!v.founder,
      note: v.note?.trim() || null,
    }
    try {
      await update.mutateAsync({ ownerId: row.ownerId, data })
      toast.success(t('Suscripción de {name} actualizada', { name: row.ownerName ?? row.businessName }))
      onClose()
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  return (
    <EntityModal onClose={onClose} onSubmit={handleSubmit(onSubmit)} isEdit
      title={t('Suscripción')} previewName={row.ownerName || row.businessName} placeholderName={t('Dueño')}
      subtitle={`${row.ownerEmail ?? ''}${row.businessName ? ` · ${row.businessName}` : ''}`}
      avatar={<FlagAvatar code={row.countryCode} light />}
      submitting={update.isPending} submitLabel={t('Guardar cambios')}>
      <div className="grid grid-cols-2 gap-3">
        <EntityField label={t('Plan')}>
          <select {...register('plan')} className={inputCls}>
            {PLAN_KEYS.map((k) => <option key={k} value={k}>{planName(k)}</option>)}
          </select>
        </EntityField>
        <EntityField label={t('Estado')}>
          <select {...register('status')} className={inputCls}>
            {STATUSES.map((s) => <option key={s} value={s}>{t(STATUS_LABEL[s])}</option>)}
          </select>
        </EntityField>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <EntityField label={t('Prueba hasta')} error={errors.trialEndsAt?.message}>
          <input type="date" {...register('trialEndsAt')} className={inputCls} />
        </EntityField>
        <EntityField label={t('Pagado hasta')} hint={t('Vacío = sin vencimiento (cuenta de lanzamiento)')}>
          <input type="date" {...register('paidUntil')} className={inputCls} />
        </EntityField>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <EntityField label={t('Descuento %')}>
          <input type="number" min="0" max="100" step="1" {...register('discountPercent')} className={inputCls} />
        </EntityField>
        <EntityField label={t('Descuento hasta')}>
          <input type="date" {...register('discountUntil')} className={inputCls} />
        </EntityField>
      </div>
      <CouponField row={row} />
      <label className="flex items-center gap-3 rounded-xl bg-gray-50 px-3.5 py-3 text-sm text-gray-700">
        <input type="checkbox" {...register('launchPriceLocked')} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600" />
        {t('Precio de lanzamiento bloqueado para siempre')}
      </label>
      <label className="flex items-center gap-3 rounded-xl bg-gray-50 px-3.5 py-3 text-sm text-gray-700">
        <input type="checkbox" {...register('founder')} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600" />
        {t('Fundador (entre los primeros 50 de la promo)')}
      </label>
      <EntityField label={t('Nota')} hint={t('La ve el dueño en Ajustes › Tu plan')}>
        <textarea rows={2} {...register('note')} className={inputCls} placeholder={t('Paga todos los 15 por Yape…')} />
      </EntityField>
    </EntityModal>
  )
}

/**
 * «Cupón de Stripe» (id del cupón en el Dashboard): se aplica o se quita al momento, aparte del
 * «Guardar cambios». Con suscripción o tarjeta guardada se aplica ya en Stripe; si no, en el
 * próximo pago. 400 COUPON_INVALID si no existe o no es válido.
 */
function CouponField({ row }) {
  const t = useT()
  const setCoupon = useSetCoupon()
  const [applied, setApplied] = useState({ id: row.couponId ?? null, name: row.couponName ?? null })
  const [value, setValue] = useState(row.couponId ?? '')
  const [error, setError] = useState('')
  const who = row.ownerName ?? row.businessName

  const save = async (raw) => {
    const { couponId } = couponPayload(raw)
    setError('')
    try {
      const res = await setCoupon.mutateAsync({ ownerId: row.ownerId, couponId })
      setApplied({ id: res?.couponId ?? couponId, name: res?.couponName ?? null })
      setValue(couponId ?? '')
      toast.success(couponId ? t('{name}: cupón {coupon} aplicado', { name: who, coupon: couponId }) : t('{name}: cupón quitado', { name: who }))
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }
  const dirty = (couponPayload(value).couponId ?? null) !== (applied.id ?? null)

  return (
    <EntityField label={t('Cupón de Stripe')} error={error}
      hint={applied.id
        ? t('Aplicado: {coupon}. Con suscripción o tarjeta guardada se aplica ya en Stripe; si no, en el próximo pago.', { coupon: applied.name ? `${applied.name} (${applied.id})` : applied.id })
        : t('Id del cupón en Stripe (ej.: eazy-launch-founder). Se aplica al momento, aparte de «Guardar cambios».')}>
      <div className="flex gap-2" data-testid="coupon-field">
        <div className="relative flex-1">
          <Tag size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" value={value} onChange={(e) => { setValue(e.target.value); setError('') }}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (dirty && value.trim()) save(value) } }}
            autoComplete="off" spellCheck={false} placeholder="—" className={`${inputCls} pl-8`} data-testid="coupon-input" />
        </div>
        <button type="button" onClick={() => save(value)} disabled={setCoupon.isPending || !dirty || !value.trim()}
          className="inline-flex items-center gap-1 rounded-xl bg-blue-600 px-3 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50" data-testid="coupon-apply">
          {setCoupon.isPending ? <Loader2 size={13} className="animate-spin" /> : null} {t('Aplicar')}
        </button>
        {applied.id && (
          <button type="button" onClick={() => save(null)} disabled={setCoupon.isPending}
            className="inline-flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50" data-testid="coupon-remove">
            <X size={13} /> {t('Quitar')}
          </button>
        )}
      </div>
    </EntityField>
  )
}

function Row({ row, onEdit }) {
  const t = useT()
  const markPaid = useMarkPaid()
  const extendTrial = useExtendTrial()
  const wa = row.phone ? whatsappDigits(row.phone, row.countryCode) : null

  const run = async (m, args, okMsg) => {
    try {
      await m.mutateAsync(args)
      toast.success(okMsg)
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  const when = row.status === 'TRIAL'
    ? `${t('Prueba hasta')} ${formatDay(row.trialEndsAt)}`
    : row.paidUntil
      ? `${t('Pagado hasta')} ${formatDay(row.paidUntil)}`
      : row.status === 'ACTIVE' ? t('Sin vencimiento') : '—'
  const days = row.daysLeft != null ? (row.daysLeft === 1 ? t('1 día') : t('{n} días', { n: Math.max(0, row.daysLeft) })) : null

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm lg:flex-row lg:items-center">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <FlagAvatar code={row.countryCode} className="!h-11 !w-11" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate font-bold leading-tight text-gray-900">{row.ownerName || row.businessName}</p>
            <Chip tone={STATUS_TONE[row.status] ?? 'gray'}>{t(STATUS_LABEL[row.status] ?? row.status)}</Chip>
            <Chip tone="blue">{planName(row.plan)}</Chip>
            {row.launchPriceLocked && <Chip tone="amber">{t('Precio bloqueado')}</Chip>}
            {row.founder && <Chip tone="emerald">{t('Fundador')}</Chip>}
          </div>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-xs text-gray-500">
            <Store size={12} className="text-gray-400" />
            <span className="font-semibold text-gray-700">{row.businessName || t('Sin negocio')}</span>
            {row.businesses?.length > 1 && <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-bold text-gray-500">{row.businesses.length}</span>}
          </p>
          <p className="mt-0.5 truncate text-xs text-gray-500">
            {row.ownerEmail ?? ''}{row.ownerEmail ? ' · ' : ''}{t('desde')} {formatDay(row.createdAt)}
          </p>
          <p className="mt-0.5 text-xs text-gray-500">
            {when}{days ? ` (${days})` : ''}
            <span className="mx-1.5 text-gray-300">·</span>
            <span className="font-semibold text-gray-700">{fmtMoney(row.priceMonthly, row.currency ?? 'PEN')}/{t('mes')}</span>
            {row.discountPercent > 0 && <span className="ml-1 text-emerald-600">−{row.discountPercent}%{row.discountUntil ? ` ${t('hasta')} ${formatDay(row.discountUntil)}` : ''}</span>}
            {row.couponId && <span className="ml-1 text-emerald-700">· {t('Cupón')}: {row.couponName || row.couponId}</span>}
          </p>
          {row.note && <p className="mt-1 truncate text-xs italic text-gray-400">“{row.note}”</p>}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-1.5 lg:flex-shrink-0">
        {wa && (
          <a href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer" title={row.phone}
            className="inline-flex items-center gap-1 rounded-xl border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100">
            <MessageCircle size={13} /> WhatsApp
          </a>
        )}
        {row.ownerEmail && (
          <a href={`mailto:${row.ownerEmail}`} title={row.ownerEmail}
            className="inline-flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50">
            <Mail size={13} />
          </a>
        )}
        <button type="button" disabled={markPaid.isPending}
          onClick={() => run(markPaid, { ownerId: row.ownerId, months: 1 }, t('{name}: pagado un mes más', { name: row.ownerName ?? row.businessName }))}
          className="inline-flex items-center gap-1 rounded-xl bg-blue-600 px-2.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60">
          {markPaid.isPending ? <Loader2 size={13} className="animate-spin" /> : <CalendarPlus size={13} />} {t('Pagado +1 mes')}
        </button>
        {['TRIAL', 'EXPIRED'].includes(row.status) && (
          <button type="button" disabled={extendTrial.isPending}
            onClick={() => run(extendTrial, { ownerId: row.ownerId, days: 7 }, t('{name}: prueba extendida 7 días', { name: row.ownerName ?? row.businessName }))}
            className="inline-flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60">
            {extendTrial.isPending ? <Loader2 size={13} className="animate-spin" /> : <Clock size={13} />} {t('Prueba +7 días')}
          </button>
        )}
        <button type="button" onClick={() => onEdit(row)}
          className="inline-flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50">
          <Pencil size={13} /> {t('Editar')}
        </button>
      </div>
    </div>
  )
}

export default function SubscriptionsPage() {
  const t = useT()
  const { data, isLoading, isError, refetch, isFetching } = useBossSubscriptions()
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('ALL')
  const [editTarget, setEditTarget] = useState(null)

  // Fila del BE = { ownerId, ownerName, ownerEmail, phone, countryCode, businesses:[{id,name}], createdAt, subscription }.
  // Se aplana para que la fila y el modal lean los campos de la suscripción directo.
  const all = useMemo(() => {
    const raw = Array.isArray(data) ? data : data?.content ?? []
    return raw.map((r) => ({
      ...(r.subscription ?? {}),
      ...r,
      businesses: r.businesses ?? [],
      businessName: (r.businesses ?? []).map((b) => b.name).join(' · '),
    }))
  }, [data])
  const list = useMemo(() => {
    const s = q.trim().toLowerCase()
    return all.filter((r) => (status === 'ALL' || r.status === status)
      && (!s || r.businessName?.toLowerCase().includes(s) || r.ownerName?.toLowerCase().includes(s) || r.ownerEmail?.toLowerCase().includes(s)))
  }, [all, q, status])

  const count = (st) => all.filter((r) => r.status === st).length
  const mrr = all.filter((r) => r.status === 'ACTIVE' || r.status === 'PAST_DUE').reduce((acc, r) => acc + (Number(r.priceMonthly) || 0), 0)
  const totalBusinesses = all.reduce((acc, r) => acc + (r.businesses?.length ?? 0), 0)

  return (
    <div className="flex flex-col gap-5">
      <ReportHeader icon={CreditCard} title={t('Suscripciones')} subtitle={t('Quién está en prueba, quién paga y cuánto; el cobro es manual hasta la pasarela')}
        right={(
          <button type="button" onClick={() => refetch()}
            className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-50">
            <RefreshCw size={12} className={isFetching ? 'animate-spin' : ''} /> {t('Actualizar')}
          </button>
        )} />

      <BossSwitcher />

      <ReportHero icon={CreditCard} label={t('Ingreso mensual comprometido')} loading={isLoading}
        value={`${CURRENCY} ${fmt(mrr)}`}
        sub={<span>{t('Suma del precio efectivo de las cuentas activas (y con pago vencido en gracia)')} · {t('{n} cuentas, {m} negocios', { n: all.length, m: totalBusinesses })}</span>}
        cells={[
          [t('En prueba'), count('TRIAL')],
          [t('Activos'), count('ACTIVE')],
          [t('Pago vencido'), count('PAST_DUE'), count('PAST_DUE') > 0 ? 'text-amber-200' : ''],
          [t('Vencidos'), count('EXPIRED') + count('CANCELED'), count('EXPIRED') + count('CANCELED') > 0 ? 'text-red-200' : ''],
        ]} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex-1">
          <BigSearch value={q} onChange={setQ} placeholder={t('Buscar dueño, negocio o correo')} />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-gray-400" />
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700">
            <option value="ALL">{t('Todos los estados')}</option>
            {STATUSES.map((s) => <option key={s} value={s}>{t(STATUS_LABEL[s])}</option>)}
          </select>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center gap-2 rounded-2xl border border-gray-100 bg-white py-10 text-sm text-gray-400 shadow-sm">
          <Loader2 size={16} className="animate-spin" /> {t('Cargando...')}
        </div>
      )}
      {isError && !isLoading && (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-6 text-center text-sm text-red-500">
          {t('No se pudieron cargar las suscripciones. Intenta actualizar.')}
        </div>
      )}
      {!isLoading && !isError && list.length === 0 && (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-gray-100 bg-white px-4 py-10 text-center text-sm text-gray-400 shadow-sm">
          <Search size={18} />
          {all.length === 0 ? t('Aún no hay cuentas registradas.') : t('Nada coincide con el filtro.')}
        </div>
      )}
      {!isLoading && !isError && list.length > 0 && (
        <div className="flex flex-col gap-3">
          {list.map((r) => <Row key={r.ownerId} row={r} onEdit={setEditTarget} />)}
        </div>
      )}

      {editTarget && <EditSubscriptionModal row={editTarget} onClose={() => setEditTarget(null)} />}
    </div>
  )
}
