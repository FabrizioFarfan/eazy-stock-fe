import { CURRENCIES, CURRENCY_OPTIONS, CURRENCY_BY_COUNTRY } from '../../utils/formatMoney'
import { useMemo, useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, X, Loader2, Pencil, ChevronLeft, ChevronRight } from 'lucide-react'
import { useBusinesses, useCreateBusiness, useUpdateBusiness } from '../../hooks/useBusinesses'
import { getErrorMessage, getErrorField } from '../../utils/handleApiError'
import { useT, dateLocale } from '../../i18n'

// ── helpers ───────────────────────────────────────────────────────────────────

function formatDate(str) {
  if (!str) return '—'
  return new Intl.DateTimeFormat(dateLocale(), {
    day: 'numeric', month: 'short', year: 'numeric',
  }).format(new Date(str))
}

const inputCls =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 placeholder-gray-400'

const PAGE_SIZE = 20

// ── form schema ───────────────────────────────────────────────────────────────

const makeSchema = (t) => z.object({
  name:        z.string().min(2, t('Mínimo 2 caracteres')),
  countryCode: z.string().min(2).max(3, t('Código de 2-3 letras')),
  currency:    z.string().length(3, t('Requerido')),
  taxIdType:   z.string().min(1, t('Requerido')),
  taxId:       z.string().min(1, t('Requerido')),
})

// Common country options
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

// Common tax ID types
const TAX_TYPES = ['RUC', 'CUIT', 'RFC', 'NIT', 'RUT', 'DNI', 'OTRO']

function SkeletonRow() {
  return (
    <tr>
      {Array.from({ length: 6 }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 animate-pulse rounded bg-gray-100" />
        </td>
      ))}
    </tr>
  )
}

// ── BusinessFormModal ─────────────────────────────────────────────────────────

function BusinessFormModal({ business, onClose }) {
  const t             = useT()
  const isEdit        = !!business
  const createBiz     = useCreateBusiness()
  const updateBiz     = useUpdateBusiness()
  const mutation      = isEdit ? updateBiz : createBiz
  const isPending     = mutation.isPending
  const schema        = useMemo(() => makeSchema(t), [t])

  const {
    register,
    handleSubmit,
    setError,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: business
      ? {
          name:        business.name,
          countryCode: business.countryCode,
          currency:    business.currency ?? 'PEN',
          taxIdType:   business.taxIdType,
          taxId:       business.taxId,
        }
      : { countryCode: 'PE', currency: 'PEN', taxIdType: 'RUC' },
  })

  const watchedCountry = watch('countryCode')
  useEffect(() => {
    // al elegir país, proponer su moneda (se puede corregir a mano)
    const suggested = CURRENCY_BY_COUNTRY[watchedCountry]
    if (suggested && (!isEdit || watchedCountry !== business?.countryCode)) setValue('currency', suggested)
  }, [watchedCountry]) // eslint-disable-line react-hooks/exhaustive-deps

  const onSubmit = async (values) => {
    try {
      if (isEdit) {
        await updateBiz.mutateAsync({ id: business.id, data: values })
      } else {
        await createBiz.mutateAsync(values)
      }
      onClose()
    } catch (err) {
      const field = getErrorField(err)
      if (field && ['name', 'taxId', 'taxIdType', 'countryCode', 'currency'].includes(field)) {
        setError(field, { type: 'server', message: getErrorMessage(err) })
      }
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <h3 className="text-base font-semibold text-gray-900">
            {isEdit ? t('Editar negocio') : t('Nuevo negocio')}
          </h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="space-y-4 px-5 py-5">
            {/* Name */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                {t('Nombre del negocio')} <span className="text-red-500">*</span>
              </label>
              <input
                {...register('name')}
                type="text"
                placeholder={t('Ej. Ferretería El Sol')}
                className={inputCls}
              />
              {errors.name && (
                <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>
              )}
            </div>

            {/* Country + taxIdType side by side */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  {t('País')} <span className="text-red-500">*</span>
                </label>
                <select {...register('countryCode')} className={inputCls}>
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>{t(c.label)}</option>
                  ))}
                </select>
                {errors.countryCode && (
                  <p className="mt-1 text-xs text-red-500">{errors.countryCode.message}</p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  {t('Tipo ID tributario')} <span className="text-red-500">*</span>
                </label>
                <select {...register('taxIdType')} className={inputCls}>
                  {TAX_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                {errors.taxIdType && (
                  <p className="mt-1 text-xs text-red-500">{errors.taxIdType.message}</p>
                )}
              </div>
            </div>

            {/* Currency — solo el símbolo/formato, sin conversión */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                {t('Moneda')} <span className="text-red-500">*</span>
              </label>
              <select {...register('currency')} className={inputCls}>
                {CURRENCY_OPTIONS.map((code) => (
                  <option key={code} value={code}>{code} · {CURRENCIES[code].symbol} — {t(CURRENCIES[code].name)}</option>
                ))}
              </select>
              {errors.currency && (
                <p className="mt-1 text-xs text-red-500">{errors.currency.message}</p>
              )}
            </div>

            {/* Tax ID */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                {t('Número de identificación')} <span className="text-red-500">*</span>
              </label>
              <input
                {...register('taxId')}
                type="text"
                placeholder={t('Ej. 20601234567')}
                className={inputCls}
              />
              {errors.taxId && (
                <p className="mt-1 text-xs text-red-500">{errors.taxId.message}</p>
              )}
            </div>

            {mutation.isError && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                {getErrorMessage(mutation.error)}
              </p>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 border-t border-gray-200 px-5 py-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
            >
              {t('Cancelar')}
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {isPending && <Loader2 size={14} className="animate-spin" />}
              {isPending ? t('Guardando...') : isEdit ? t('Guardar cambios') : t('Crear negocio')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── page ──────────────────────────────────────────────────────────────────────

export default function BusinessesPage() {
  const t = useT()
  const [page, setPage]       = useState(0)
  const [modal, setModal]     = useState(null) // null | 'create' | business object

  const { data, isLoading, isFetching } = useBusinesses({
    page,
    size: PAGE_SIZE,
    sort: 'name',
  })

  const businesses    = data?.content       ?? []
  const totalElements = data?.totalElements ?? 0
  const totalPages    = data?.totalPages    ?? 0
  const fromRow       = totalElements === 0 ? 0 : page * PAGE_SIZE + 1
  const toRow         = Math.min((page + 1) * PAGE_SIZE, totalElements)

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-gray-900">{t('Negocios')}</h2>
        <button
          onClick={() => setModal('create')}
          className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          <Plus size={15} />
          {t('Nuevo negocio')}
        </button>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                <th className="px-4 py-3">{t('Nombre')}</th>
                <th className="px-4 py-3">{t('País')}</th>
                <th className="px-4 py-3">{t('Tipo ID')}</th>
                <th className="px-4 py-3">{t('Nro. Identificación')}</th>
                <th className="px-4 py-3 text-center">{t('Estado')}</th>
                <th className="px-4 py-3">{t('Registrado')}</th>
                <th className="px-4 py-3 text-center">{t('Acciones')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              ) : businesses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-sm text-gray-400">
                    {t('No hay negocios registrados')}
                  </td>
                </tr>
              ) : (
                businesses.map((b) => (
                  <tr
                    key={b.id}
                    className={`transition-colors hover:bg-gray-50 ${isFetching ? 'opacity-60' : ''}`}
                  >
                    <td className="px-4 py-3 font-medium text-gray-900 max-w-[180px] truncate">
                      {b.name}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">
                      {b.countryCode}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{b.taxIdType}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">{b.taxId}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        b.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {b.active ? t('Activo') : t('Inactivo')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{formatDate(b.createdAt)}</td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => setModal(b)}
                        title={t('Editar')}
                        className="inline-flex items-center gap-1 rounded-lg bg-gray-50 px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100"
                      >
                        <Pencil size={12} />
                        {t('Editar')}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
            <p className="text-sm text-gray-500">
              {t('Mostrando')}{' '}
              <span className="font-medium">{fromRow}–{toRow}</span> {t('de')}{' '}
              <span className="font-medium">{totalElements}</span> {t('negocios')}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40"
              >
                <ChevronLeft size={14} />{t('Anterior')}
              </button>
              <span className="px-2 text-sm text-gray-500">{page + 1} / {totalPages}</span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40"
              >
                {t('Siguiente')}<ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <BusinessFormModal
          business={modal === 'create' ? null : modal}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}
