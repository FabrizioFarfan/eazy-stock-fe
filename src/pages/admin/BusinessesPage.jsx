import { CURRENCIES, CURRENCY_OPTIONS, CURRENCY_BY_COUNTRY } from '../../utils/formatMoney'
import { useMemo, useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Building2, Coins, CalendarDays, Globe, PowerOff, FileDigit } from 'lucide-react'
import { toast } from 'sonner'
import { useBusinesses, useCreateBusiness, useUpdateBusiness, useDeleteBusiness } from '../../hooks/useBusinesses'
import { getErrorMessage, getErrorField } from '../../utils/handleApiError'
import { ReportHeader, ReportHero, BigSearch, NewButton, EntityCard } from '../../components/reports/ReportKit'
import EntityModal, { EntityField } from '../../components/common/EntityModal'
import { BossSwitcher, FlagAvatar, Chip, ConfirmCard } from '../../components/boss/BossKit'
import { formatDate, isThisMonth } from '../../components/boss/bossUtils'
import { useT } from '../../i18n'

const inputCls =
  'rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 placeholder-gray-400 w-full bg-white'

// ── form schema ───────────────────────────────────────────────────────────────

const makeSchema = (t) => z.object({
  name:        z.string().min(2, t('Mínimo 2 caracteres')),
  countryCode: z.string().min(2).max(3, t('Código de 2-3 letras')),
  currency:    z.string().length(3, t('Requerido')),
  taxIdType:   z.string().min(1, t('Requerido')),
  taxId:       z.string().min(1, t('Requerido')),
})

const COUNTRIES = [
  { code: 'PE', label: 'Perú (PE)' },
  { code: 'CO', label: 'Colombia (CO)' },
  { code: 'AR', label: 'Argentina (AR)' },
  { code: 'MX', label: 'México (MX)' },
  { code: 'CL', label: 'Chile (CL)' },
  { code: 'EC', label: 'Ecuador (EC)' },
  { code: 'BO', label: 'Bolivia (BO)' },
  { code: 'UY', label: 'Uruguay (UY)' },
  { code: 'US', label: 'Estados Unidos (US)' },
  // Europa (Frank, sep-2026)
  { code: 'ES', label: 'España (ES)' },
  { code: 'IT', label: 'Italia (IT)' },
  { code: 'PL', label: 'Polonia (PL)' },
  { code: 'DE', label: 'Alemania (DE)' },
  { code: 'FR', label: 'Francia (FR)' },
  { code: 'PT', label: 'Portugal (PT)' },
]
const countryLabel = (code) => COUNTRIES.find((c) => c.code === code)?.label.replace(/ \(\w+\)$/, '') ?? code

const TAX_TYPES = ['RUC', 'CUIT', 'RFC', 'NIT', 'RUT', 'DNI', 'OTRO']

// ── Modal de negocio (EntityModal: cabecera azul con vista previa) ───────────

function BusinessFormModal({ business, onClose }) {
  const t         = useT()
  const isEdit    = !!business
  const createBiz = useCreateBusiness()
  const updateBiz = useUpdateBusiness()
  const mutation  = isEdit ? updateBiz : createBiz
  const schema    = useMemo(() => makeSchema(t), [t])

  const { register, handleSubmit, setError, watch, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: business
      ? { name: business.name, countryCode: business.countryCode, currency: business.currency ?? 'PEN', taxIdType: business.taxIdType, taxId: business.taxId }
      : { countryCode: 'PE', currency: 'PEN', taxIdType: 'RUC' },
  })

  const watchedCountry = watch('countryCode')
  const watchedCurrency = watch('currency')
  useEffect(() => {
    // al elegir país, proponer su moneda (se puede corregir a mano)
    const suggested = CURRENCY_BY_COUNTRY[watchedCountry]
    if (suggested && (!isEdit || watchedCountry !== business?.countryCode)) setValue('currency', suggested)
  }, [watchedCountry]) // eslint-disable-line react-hooks/exhaustive-deps

  const onSubmit = async (values) => {
    try {
      if (isEdit) await updateBiz.mutateAsync({ id: business.id, data: values })
      else        await createBiz.mutateAsync(values)
      toast.success(isEdit ? t('Negocio actualizado') : t('Negocio creado'))
      onClose()
    } catch (err) {
      const field = getErrorField(err)
      if (field && ['name', 'taxId', 'taxIdType', 'countryCode', 'currency'].includes(field)) {
        setError(field, { type: 'server', message: getErrorMessage(err) })
      }
    }
  }

  const fieldError = (k) => errors[k]?.message
  const serverError = mutation.isError && !getErrorField(mutation.error) ? getErrorMessage(mutation.error) : null

  return (
    <EntityModal onClose={onClose} onSubmit={handleSubmit(onSubmit)} isEdit={isEdit}
      title={isEdit ? t('Editar negocio') : t('Nuevo negocio')}
      avatar={<FlagAvatar code={watchedCountry} light className="!h-14 !w-14 !text-3xl" />}
      previewName={watch('name')} placeholderName={t('Nombre del negocio')}
      subtitle={`${countryLabel(watchedCountry)} · ${watchedCurrency} ${CURRENCIES[watchedCurrency]?.symbol ?? ''}`}
      submitting={mutation.isPending} submitLabel={isEdit ? t('Guardar cambios') : t('Crear negocio')} error={serverError}>

      <EntityField label={`${t('Nombre del negocio')} *`} error={fieldError('name')}>
        <input {...register('name')} placeholder={t('Ej. Ferretería El Sol')} className={`${inputCls} py-3 text-base font-semibold`} autoFocus />
      </EntityField>

      <div className="grid grid-cols-2 gap-3">
        <EntityField label={`${t('País')} *`} error={fieldError('countryCode')}>
          <select {...register('countryCode')} className={inputCls}>
            {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{t(c.label)}</option>)}
          </select>
        </EntityField>
        <EntityField label={`${t('Tipo ID tributario')} *`} error={fieldError('taxIdType')}>
          <select {...register('taxIdType')} className={inputCls}>
            {TAX_TYPES.map((x) => <option key={x} value={x}>{x}</option>)}
          </select>
        </EntityField>
      </div>

      <EntityField label={`${t('Moneda')} *`} hint={t('Solo el símbolo y el formato: no hay conversión')} error={fieldError('currency')}>
        <select {...register('currency')} className={inputCls}>
          {CURRENCY_OPTIONS.map((code) => (
            <option key={code} value={code}>{code} · {CURRENCIES[code].symbol} — {t(CURRENCIES[code].name)}</option>
          ))}
        </select>
      </EntityField>

      <EntityField label={`${t('Número de identificación')} *`} error={fieldError('taxId')}>
        <input {...register('taxId')} placeholder={t('Ej. 20601234567')} className={`${inputCls} font-mono`} />
      </EntityField>
    </EntityModal>
  )
}

// ── Desactivar (soft delete: los datos se conservan) ──────────────────────────

function DeactivateModal({ business, onClose }) {
  const t = useT()
  const deactivate = useDeleteBusiness()
  const onConfirm = async () => {
    try {
      await deactivate.mutateAsync(business.id)
      toast.success(t('Negocio «{name}» desactivado', { name: business.name }))
      onClose()
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }
  return (
    <ConfirmCard icon={PowerOff} tone="amber" title={t('Desactivar negocio')} onClose={onClose}
      onConfirm={onConfirm} confirmLabel={t('Desactivar')} pending={deactivate.isPending}>
      <div className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50 p-3">
        <FlagAvatar code={business.countryCode} />
        <div className="min-w-0">
          <p className="truncate font-bold text-gray-900">{business.name}</p>
          <p className="text-xs text-gray-400">{business.taxIdType} {business.taxId}</p>
        </div>
      </div>
      <p>{t('El negocio deja de aparecer en las listas. Sus productos, ventas y usuarios se conservan: no se borra nada.')}</p>
    </ConfirmCard>
  )
}

// ── Página ────────────────────────────────────────────────────────────────────

export default function BusinessesPage() {
  const t = useT()
  const [modal, setModal] = useState(null)   // null | 'create' | business
  const [deactivating, setDeactivating] = useState(null)
  const [q, setQ] = useState('')

  // Pocos negocios (plataforma joven): se traen todos y se filtra en el navegador.
  const { data, isLoading } = useBusinesses({ page: 0, size: 200, sort: 'name' })
  const all = data?.content ?? []

  const list = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return all
    return all.filter((b) => b.name.toLowerCase().includes(s) || b.taxId?.toLowerCase().includes(s)
      || b.countryCode?.toLowerCase() === s || countryLabel(b.countryCode).toLowerCase().includes(s))
  }, [all, q])

  const active     = all.filter((b) => b.active)
  const countries  = new Set(all.map((b) => b.countryCode)).size
  const currencies = new Set(all.map((b) => b.currency ?? 'PEN')).size
  const newMonth   = all.filter((b) => isThisMonth(b.createdAt)).length

  return (
    <div className="flex flex-col gap-5">
      <ReportHeader icon={Building2} title={t('Negocios')} subtitle={t('Cada negocio que usa Eazy Stock, con su país y su moneda')}
        right={<NewButton onClick={() => setModal('create')}><Plus size={16} />{t('Nuevo negocio')}</NewButton>} />

      <BossSwitcher />

      <ReportHero icon={Building2} label={t('Negocios activos')} value={active.length} loading={isLoading}
        sub={<span>{all.length - active.length > 0 ? t('{n} inactivo(s)', { n: all.length - active.length }) : t('Todos en marcha')}</span>}
        cells={[
          [t('Países'), countries],
          [t('Monedas'), currencies],
          [t('Nuevos este mes'), newMonth],
          [t('En total'), all.length],
        ]} />

      <BigSearch value={q} onChange={setQ} placeholder={t('Buscar por nombre, RUC o país...')} />

      {isLoading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-36 animate-pulse rounded-2xl bg-gray-100" />)}
        </div>
      ) : list.length === 0 ? (
        <div className="rounded-2xl border border-gray-100 bg-white px-4 py-12 text-center shadow-sm">
          <p className="text-sm font-semibold text-gray-700">{q ? t('Ningún negocio coincide con «{q}»', { q }) : t('No hay negocios registrados')}</p>
          {q && <button type="button" onClick={() => setQ('')} className="mt-2 text-xs font-semibold text-blue-600 hover:underline">{t('Ver todos')}</button>}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((b) => (
            <EntityCard key={b.id} avatar={<FlagAvatar code={b.countryCode} />} title={b.name}
              subtitle={<span>{countryLabel(b.countryCode)} · {b.taxIdType} <span className="font-mono">{b.taxId}</span></span>}
              onOpen={() => setModal(b)} onEdit={() => setModal(b)}
              onDelete={b.active ? () => setDeactivating(b) : undefined}>
              <div className="flex flex-wrap gap-1.5">
                <Chip icon={Coins} tone="blue">{b.currency ?? 'PEN'} {CURRENCIES[b.currency ?? 'PEN']?.symbol ?? ''}</Chip>
                <Chip icon={Globe}>{b.countryCode}</Chip>
                <Chip tone={b.active ? 'emerald' : 'red'}>{b.active ? t('Activo') : t('Inactivo')}</Chip>
              </div>
              <p className="flex items-center gap-1 text-[11px] text-gray-400">
                <CalendarDays size={11} /> {t('Registrado el {date}', { date: formatDate(b.createdAt) })}
              </p>
            </EntityCard>
          ))}
        </div>
      )}

      <p className="flex items-center justify-center gap-1.5 text-center text-xs text-gray-300">
        <FileDigit size={12} /> {t('El dueño edita el nombre, el RUC y la moneda desde sus Ajustes; aquí los ves todos.')}
      </p>

      {modal && <BusinessFormModal business={modal === 'create' ? null : modal} onClose={() => setModal(null)} />}
      {deactivating && <DeactivateModal business={deactivating} onClose={() => setDeactivating(null)} />}
    </div>
  )
}
