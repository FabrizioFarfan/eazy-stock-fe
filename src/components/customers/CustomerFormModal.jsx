import { useEffect, useMemo, useState } from 'react'
import { useDebounce } from '../../hooks/useDebounce'
import { useCustomerSearch } from '../../hooks/useCustomers'
import { formatPhoneDisplay } from '../../utils/phone'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Loader2, UserCheck } from 'lucide-react'
import { toast } from 'sonner'
import { useCreateCustomer, useUpdateCustomer } from '../../hooks/useCustomers'
import { useAuth } from '../../context/AuthContext'
import { adminBizParam } from '../../utils/adminBiz'
import PriceInput from '../inputs/PriceInput'
import PhoneInput from '../inputs/PhoneInput'
import { isValidPhone } from '../../utils/phone'
import PriceInputModeToggle from '../inputs/PriceInputModeToggle'
import { getErrorMessage, getErrorField } from '../../utils/handleApiError'
import { useT } from '../../i18n'

// Teléfono opcional, en E.164 con prefijo de país (PhoneInput lo arma).
const makeSchema = (t) => z.object({
  name:        z.string().min(2, t('Mínimo 2 caracteres')),
  documentId:  z.string().max(20, t('Máximo 20 caracteres')).optional().or(z.literal('')),
  phone:       z.string().optional().refine((v) => isValidPhone(v), t('Teléfono inválido')),
  email:       z.string().email(t('Email inválido')).optional().or(z.literal('')),
  address:     z.string().max(500).optional().or(z.literal('')),
  // Obligatorio: 0 es válido (significa "no se le fía"), pero no puede quedar vacío.
  creditLimit: z.preprocess(
                (v) => (v === '' || v == null ? undefined : v),
                z.coerce.number({
                  invalid_type_error: t('Número inválido'),
                  required_error: t('El límite de crédito es obligatorio'),
                }).min(0, t('No puede ser negativo')),
              ),
  notes:       z.string().optional(),
})

const inputCls = 'w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 placeholder-gray-400'

function Field({ label, required, error, children }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700">
        {label}{required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

/**
 * `onPickExisting(c)`: cuando se está CREANDO desde una venta o cotización,
 * el formulario busca mientras se escribe el nombre, documento o teléfono y,
 * si ya hay alguien parecido, lo muestra con «Usar este» — así el vendedor
 * nuevo no registra dos veces al mismo cliente (el caso de William, 2-sep).
 */
export default function CustomerFormModal({ customer, onClose, onCreated, initialName, onPickExisting }) {
  const t = useT()
  const { user } = useAuth()
  const isEdit = !!customer
  const create = useCreateCustomer()
  const update = useUpdateCustomer()
  const mutation = isEdit ? update : create
  const schema = useMemo(() => makeSchema(t), [t])

  const {
    register, control, handleSubmit, reset, setError, watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: isEdit ? {
      name:        customer.name        ?? '',
      documentId:  customer.documentId  ?? '',
      phone:       customer.phone       ?? '',
      email:       customer.email       ?? '',
      address:     customer.address     ?? '',
      creditLimit: customer.creditLimit ?? '',
      notes:       customer.notes       ?? '',
    } : { name: initialName ?? '' },
  })

  useEffect(() => {
    if (isEdit) {
      reset({
        name:        customer.name        ?? '',
        documentId:  customer.documentId  ?? '',
        phone:       customer.phone       ?? '',
        email:       customer.email       ?? '',
        address:     customer.address     ?? '',
        creditLimit: customer.creditLimit ?? '',
        notes:       customer.notes       ?? '',
      })
    }
  }, [customer?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // posibles duplicados: se busca por lo que se va escribiendo (solo al crear)
  const wName  = watch('name')
  const wDoc   = watch('documentId')
  const wPhone = watch('phone')
  const lookalikeTerm = useDebounce((!isEdit && onPickExisting) ? (String(wDoc ?? '').trim() || String(wName ?? '').trim()) : '', 400)
  const lookalikes = useCustomerSearch(lookalikeTerm.length >= 3 ? lookalikeTerm : '', {}, { enabled: lookalikeTerm.length >= 3 })
  const phoneDigits = String(wPhone ?? '').replace(/\D/g, '').slice(-7)
  const phoneMatch = useCustomerSearch(phoneDigits.length >= 7 && !isEdit && onPickExisting ? phoneDigits : '', {}, { enabled: phoneDigits.length >= 7 && !isEdit && !!onPickExisting })
  const similar = useMemo(() => {
    const seen = new Set()
    return [...(phoneMatch.items ?? []), ...(lookalikes.items ?? [])].filter((c) => (seen.has(c.id) ? false : (seen.add(c.id), true))).slice(0, 4)
  }, [phoneMatch.items, lookalikes.items])
  const [dismissedSimilar, setDismissedSimilar] = useState(false)

  const onSubmit = async (values) => {
    try {
      const payload = {
        ...values,
        creditLimit: values.creditLimit === '' ? null : values.creditLimit,
      }
      if (isEdit) {
        await update.mutateAsync({ id: customer.id, data: payload, params: adminBizParam(user) })
        toast.success(t('Cliente actualizado'))
      } else {
        const created = await create.mutateAsync({ ...payload, ...adminBizParam(user) })
        toast.success(t('Cliente creado'))
        onCreated?.(created)
      }
      onClose()
    } catch (err) {
      const field = getErrorField(err)
      const known = ['name', 'documentId', 'phone', 'email', 'address', 'creditLimit']
      if (field && known.includes(field)) {
        setError(field, { type: 'server', message: getErrorMessage(err) })
      }
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4">
      <div className="flex w-full max-w-xl flex-col rounded-2xl bg-white shadow-xl max-h-[92vh]">

        <div className="flex flex-shrink-0 items-center justify-between border-b border-gray-200 px-5 py-4">
          <h3 className="text-base font-semibold text-gray-900">
            {isEdit ? t('Editar cliente') : t('Nuevo cliente')}
          </h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex min-h-0 flex-col">
          <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">

            <Field label={t('Nombre')} required error={errors.name?.message}>
              <input {...register('name')} placeholder="Pedro González" className={inputCls} />
            </Field>

            {similar.length > 0 && !dismissedSimilar && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5">
                <p className="text-xs font-semibold text-amber-900">{t('¿Es alguno de estos? Ya están registrados:')}</p>
                <ul className="mt-1.5 space-y-1">
                  {similar.map((c) => (
                    <li key={c.id} className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-gray-900">{c.name}</p>
                        <p className="truncate text-[11px] text-gray-600">{[c.documentId, formatPhoneDisplay(c.phone)].filter(Boolean).join(' · ')}</p>
                      </div>
                      <button type="button" onClick={() => onPickExisting(c)}
                        className="flex flex-shrink-0 items-center gap-1 rounded-lg bg-amber-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-amber-700">
                        <UserCheck size={12} /> {t('Usar este')}
                      </button>
                    </li>
                  ))}
                </ul>
                <button type="button" onClick={() => setDismissedSimilar(true)} className="mt-1.5 text-[11px] font-medium text-amber-800 underline">
                  {t('No, es otra persona')}
                </button>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Field label={t('Documento (DNI/RUC)')} error={errors.documentId?.message}>
                <input {...register('documentId')} placeholder="12345678" className={inputCls} />
              </Field>
              <Field label={t('Teléfono')} error={errors.phone?.message}>
                <Controller
                  control={control}
                  name="phone"
                  render={({ field }) => <PhoneInput value={field.value ?? ''} onChange={field.onChange} />}
                />
              </Field>
            </div>

            <Field label={t('Email')} error={errors.email?.message}>
              <input {...register('email')} type="email" placeholder="cliente@example.com" className={inputCls} />
            </Field>

            <Field label={t('Dirección')} error={errors.address?.message}>
              <input {...register('address')} placeholder={t('Av. siempre viva 742')} className={inputCls} />
            </Field>

            <div>
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-gray-700">
                  {t('Límite de crédito')}<span className="ml-0.5 text-red-500">*</span>
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-gray-400">{t('Formato del precio')}</span>
                  <PriceInputModeToggle />
                </div>
              </div>
              <Controller
                control={control}
                name="creditLimit"
                render={({ field }) => (
                  <PriceInput
                    helperText={t('0 → el cliente existe pero no puede operar al fiado.')}
                    value={field.value === '' ? null : field.value}
                    onChange={(v) => field.onChange(v ?? '')}
                    error={errors.creditLimit?.message}
                    maxDecimals={2}
                  />
                )}
              />
            </div>

            <Field label={t('Notas')} error={errors.notes?.message}>
              <textarea {...register('notes')} rows={2} placeholder={t('Notas (opcional)...')}
                className={`${inputCls} resize-none`} />
            </Field>

            {mutation.isError && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                {getErrorMessage(mutation.error)}
              </p>
            )}
          </div>

          <div className="flex flex-shrink-0 justify-end gap-2 border-t border-gray-200 px-5 py-4">
            <button type="button" onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100">
              {t('Cancelar')}
            </button>
            <button type="submit" disabled={mutation.isPending}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
              {mutation.isPending && <Loader2 size={14} className="animate-spin" />}
              {mutation.isPending ? t('Guardando...') : (isEdit ? t('Guardar cambios') : t('Crear cliente'))}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
