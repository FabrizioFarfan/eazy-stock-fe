import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useCreateCustomer, useUpdateCustomer } from '../../hooks/useCustomers'
import PriceInput from '../inputs/PriceInput'
import { getErrorMessage, getErrorField } from '../../utils/handleApiError'

// Teléfono opcional: 9 dígitos (formato Lima) si se ingresa.
const peruvianPhone = z.string()
  .optional()
  .refine((v) => !v || /^\d{9}$/.test(v.trim()), 'Debe ser 9 dígitos')

const schema = z.object({
  name:        z.string().min(2, 'Mínimo 2 caracteres'),
  documentId:  z.string().max(20, 'Máximo 20 caracteres').optional().or(z.literal('')),
  phone:       peruvianPhone,
  email:       z.string().email('Email inválido').optional().or(z.literal('')),
  address:     z.string().max(500).optional().or(z.literal('')),
  creditLimit: z.coerce.number({ invalid_type_error: 'Número inválido' })
                .min(0, 'No puede ser negativo')
                .optional()
                .or(z.literal('')),
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

export default function CustomerFormModal({ customer, onClose, onCreated, initialName }) {
  const isEdit = !!customer
  const create = useCreateCustomer()
  const update = useUpdateCustomer()
  const mutation = isEdit ? update : create

  const {
    register, control, handleSubmit, reset, setError,
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

  const onSubmit = async (values) => {
    try {
      const payload = {
        ...values,
        creditLimit: values.creditLimit === '' ? null : values.creditLimit,
      }
      if (isEdit) {
        await update.mutateAsync({ id: customer.id, data: payload })
        toast.success('Cliente actualizado')
      } else {
        const created = await create.mutateAsync(payload)
        toast.success('Cliente creado')
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
            {isEdit ? 'Editar cliente' : 'Nuevo cliente'}
          </h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex min-h-0 flex-col">
          <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">

            <Field label="Nombre" required error={errors.name?.message}>
              <input {...register('name')} placeholder="Pedro González" className={inputCls} />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Documento (DNI/RUC)" error={errors.documentId?.message}>
                <input {...register('documentId')} placeholder="12345678" className={inputCls} />
              </Field>
              <Field label="Teléfono" error={errors.phone?.message}>
                <input {...register('phone')} placeholder="987654321" className={inputCls} />
              </Field>
            </div>

            <Field label="Email" error={errors.email?.message}>
              <input {...register('email')} type="email" placeholder="cliente@example.com" className={inputCls} />
            </Field>

            <Field label="Dirección" error={errors.address?.message}>
              <input {...register('address')} placeholder="Av. siempre viva 742" className={inputCls} />
            </Field>

            <Controller
              control={control}
              name="creditLimit"
              render={({ field }) => (
                <PriceInput
                  label="Límite de crédito"
                  helperText="Vacío o 0 → el cliente existe pero no puede operar al fiado."
                  value={field.value === '' ? null : field.value}
                  onChange={(v) => field.onChange(v ?? '')}
                  error={errors.creditLimit?.message}
                  maxDecimals={2}
                />
              )}
            />

            <Field label="Notas" error={errors.notes?.message}>
              <textarea {...register('notes')} rows={2} placeholder="Notas (opcional)..."
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
              Cancelar
            </button>
            <button type="submit" disabled={mutation.isPending}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
              {mutation.isPending && <Loader2 size={14} className="animate-spin" />}
              {mutation.isPending ? 'Guardando...' : (isEdit ? 'Guardar cambios' : 'Crear cliente')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
