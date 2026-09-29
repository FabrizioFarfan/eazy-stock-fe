import { useMemo, useState } from 'react'
import { Plus, Truck, Loader2, X, Phone, User, FileText } from 'lucide-react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useSuppliers, useCreateSupplier, useUpdateSupplier, useDeleteSupplier } from '../hooks/useSuppliers'
import { useAuth } from '../context/AuthContext'
import { adminBizParam } from '../utils/adminBiz'
import { useDebounce } from '../hooks/useDebounce'
import { AccountsSwitcher, ReportHero, ReportHeader, BigSearch, NewButton, EntityCard } from '../components/reports/ReportKit'
import { usePayables } from '../hooks/useReports'
import { formatPrice } from '../utils/formatMoney'
import { useNavigate } from 'react-router-dom'
import { getErrorMessage, getErrorField } from '../utils/handleApiError'
import HelpDrawer from '../components/common/HelpDrawer'
import { useT } from '../i18n'
import PhoneInput from '../components/inputs/PhoneInput'
import { isValidPhone, formatPhoneDisplay } from '../utils/phone'

const makeSchema = (t) => z.object({
  name:    z.string().min(2, t('Mínimo 2 caracteres')),
  ruc:     z.string().optional(),
  contact: z.string().optional(),
  phone:   z.string().optional().refine((v) => isValidPhone(v), t('Teléfono inválido')),
  notes:   z.string().optional(),
})

const inputCls =
  'rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 placeholder-gray-400 w-full bg-white'

function Field({ label, error, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

// ── Supplier modal ────────────────────────────────────────────────────────────

function SupplierModal({ supplier, onClose }) {
  const t = useT()
  const schema = useMemo(() => makeSchema(t), [t])
  const { user } = useAuth()
  const isEdit   = !!supplier
  const create   = useCreateSupplier()
  const update   = useUpdateSupplier()
  const mutation = isEdit ? update : create

  const { register, control, handleSubmit, setError, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: isEdit
      ? { name: supplier.name, ruc: supplier.ruc ?? '', contact: supplier.contact ?? '', phone: supplier.phone ?? '', notes: supplier.notes ?? '' }
      : {},
  })

  const onSubmit = async (values) => {
    try {
      if (isEdit) await update.mutateAsync({ id: supplier.id, data: values, params: adminBizParam(user) })
      else await create.mutateAsync({ ...values, ...adminBizParam(user) })
      onClose()
    } catch (err) {
      const field = getErrorField(err)
      if (field && ['name', 'ruc', 'contact', 'phone', 'notes'].includes(field)) {
        setError(field, { type: 'server', message: getErrorMessage(err) })
      }
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
          <h3 className="text-base font-bold text-gray-900">
            {isEdit ? t('Editar proveedor') : t('Nuevo proveedor')}
          </h3>
          <button onClick={onClose} className="rounded-xl p-2 text-gray-400 hover:bg-gray-100 transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="space-y-4 px-6 py-5">
            <Field label={t('Nombre *')} error={errors.name?.message}>
              <input {...register('name')} placeholder={t('Ej. Distribuidora Lima SAC')} className={inputCls} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label={t('RUC')} error={errors.ruc?.message}>
                <input {...register('ruc')} placeholder="20123456789" className={inputCls} />
              </Field>
              <Field label={t('Teléfono')} error={errors.phone?.message}>
                <Controller
                  control={control}
                  name="phone"
                  render={({ field }) => <PhoneInput value={field.value ?? ''} onChange={field.onChange} />}
                />
              </Field>
            </div>
            <Field label={t('Contacto')} error={errors.contact?.message}>
              <input {...register('contact')} placeholder={t('Nombre del contacto')} className={inputCls} />
            </Field>
            <Field label={t('Notas')} error={errors.notes?.message}>
              <textarea {...register('notes')} rows={2}
                placeholder={t('Condiciones de pago, observaciones...')}
                className={`${inputCls} resize-none`} />
            </Field>
            {mutation.isError && (
              <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 ring-1 ring-red-100">
                {getErrorMessage(mutation.error)}
              </p>
            )}
          </div>
          <div className="flex justify-end gap-2 border-t border-gray-100 px-6 py-4">
            <button type="button" onClick={onClose}
              className="rounded-xl px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
              {t('Cancelar')}
            </button>
            <button type="submit" disabled={mutation.isPending}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-600/30 hover:bg-blue-700 transition-all active:scale-[0.98] disabled:opacity-60">
              {mutation.isPending && <Loader2 size={14} className="animate-spin" />}
              {mutation.isPending ? t('Guardando...') : t('Guardar')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Supplier card ─────────────────────────────────────────────────────────────

function SupplierCard({ supplier, debt, onOpen, onEdit, onDelete }) {
  const t = useT()
  const initials = supplier.name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
  const owes = Number(debt ?? 0) > 0

  return (
    <EntityCard
      avatar={(
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-sm font-extrabold text-white shadow-md shadow-blue-600/25">
          {initials}
        </div>
      )}
      title={supplier.name}
      subtitle={supplier.ruc ? <span className="font-mono">RUC {supplier.ruc}</span> : null}
      onOpen={onOpen} onEdit={onEdit} onDelete={onDelete}
      link={{ to: `/products?supplierId=${supplier.id}`, label: t('Ver sus productos') }}
    >
      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ${
        owes ? 'bg-amber-50 text-amber-700 ring-amber-100' : 'bg-emerald-50 text-emerald-700 ring-emerald-100'}`}>
        {owes ? t('Le debes {amount}', { amount: formatPrice(debt) }) : t('Sin deuda')}
      </span>
      {supplier.contact && (
        <p className="flex items-center gap-2 text-xs text-gray-500"><User size={12} className="flex-shrink-0 text-gray-400" />{supplier.contact}</p>
      )}
      {supplier.phone && (
        <p className="flex items-center gap-2 text-xs text-gray-500"><Phone size={12} className="flex-shrink-0 text-gray-400" />{formatPhoneDisplay(supplier.phone)}</p>
      )}
      {supplier.notes && (
        <p className="flex items-start gap-2 text-xs text-gray-400"><FileText size={12} className="mt-0.5 flex-shrink-0" /><span className="line-clamp-2">{supplier.notes}</span></p>
      )}
    </EntityCard>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function SuppliersPage() {
  const t = useT()
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const [modal, setModal]   = useState(null)
  const debouncedSearch     = useDebounce(search, 400)
  const deleteSupplier      = useDeleteSupplier()

  const { data, isLoading } = useSuppliers({
    size: 50,
    ...adminBizParam(user),
    ...(debouncedSearch && { search: debouncedSearch }),
  })
  const suppliers = data?.content ?? []
  const navigate  = useNavigate()

  // Deuda por proveedor (Cuentas por pagar) para pintarla en cada tarjeta.
  const { data: payables } = usePayables(adminBizParam(user)?.businessId ? adminBizParam(user) : undefined)
  const debtById = Object.fromEntries((payables?.rows ?? []).map((r) => [r.supplierId, r.currentDebt]))
  const withPhone = suppliers.filter((x) => x.phone).length

  const handleDelete = async (s) => {
    if (!window.confirm(t('¿Eliminar "{name}"?\nEsto fallará si tiene productos asociados.', { name: s.name }))) return
    try { await deleteSupplier.mutateAsync({ id: s.id, params: adminBizParam(user) }) }
    catch (err) { alert(getErrorMessage(err)) }
  }

  return (
    <div className="flex flex-col gap-5">
      <ReportHeader icon={Truck} title={t('Proveedores')}
        subtitle={t('A quién le compras la mercadería y cuánto le debes')}
        help={(
          <HelpDrawer title={t('Cómo usar Proveedores')} autoOpenKey="eazystock_suppliers_help_v2">
            <p>{t('Tus proveedores: a quién le compras la mercadería y cuánto le debes a cada uno.')}</p>
            <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
              <p className="font-semibold text-gray-800">👆 {t('Click en un proveedor')}</p>
              <p className="mt-1">{t('Ves su cuenta corriente: recepciones de mercadería, pagos que le hiciste y su deuda actual. Desde ahí registras pagos.')}</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
              <p className="font-semibold text-gray-800">🚚 {t('¿Cómo se genera la deuda?')}</p>
              <p className="mt-1">{t('Al registrar una recepción a crédito en Stock, el monto se suma solo a la cuenta del proveedor.')}</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
              <p className="font-semibold text-gray-800">📄 {t('PDF de pedido al proveedor')}</p>
              <p className="mt-1">{t('En Reportes › Stock bajo puedes generar el pedido de reposición por proveedor: antes de descargarlo ves una previsual editable donde ajustas cantidades, quitas líneas y agregas notas. El PDF sale listo para enviarle por WhatsApp o correo.')}</p>
            </div>
            <p className="text-xs text-gray-400">{t('Tip: asigna proveedor a tus productos para usar el reporte "Resurtido" como lista de compras.')}</p>
          </HelpDrawer>
        )}
        right={<NewButton onClick={() => setModal({ supplier: null })}><Plus size={15} />{t('Nuevo proveedor')}</NewButton>} />

      <AccountsSwitcher />

      <ReportHero icon={Truck} label={t('Tus proveedores')} loading={isLoading}
        value={data?.totalElements ?? 0}
        cells={[
          [t('Les debes'), formatPrice(payables?.totalPayable ?? 0)],
          [t('Con deuda'), payables?.rows?.length ?? 0, Number(payables?.rows?.length) > 0 ? 'text-amber-200' : ''],
          [t('Con teléfono'), withPhone],
        ]} />

      <BigSearch value={search} onChange={setSearch} placeholder={t('Buscar proveedor...')} />

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-36 animate-pulse rounded-2xl bg-gray-100" />
          ))}
        </div>
      ) : suppliers.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-20">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100">
            <Truck size={28} className="text-gray-400" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-700">{t('No hay proveedores aún')}</p>
            <p className="mt-1 text-xs text-gray-400">{t('Agrega tu primer proveedor para asociarlo a productos')}</p>
          </div>
          <button onClick={() => setModal({ supplier: null })}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-all active:scale-[0.98]">
            <Plus size={14} />
            {t('Agregar proveedor')}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {suppliers.map((s) => (
            <SupplierCard key={s.id} supplier={s} debt={debtById[s.id]}
              onOpen={() => navigate(`/suppliers/${s.id}`)}
              onEdit={() => setModal({ supplier: s })}
              onDelete={() => handleDelete(s)} />
          ))}
        </div>
      )}

      {modal !== null && <SupplierModal supplier={modal.supplier} onClose={() => setModal(null)} />}
    </div>
  )
}
