import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Loader2, Search, Building2 } from 'lucide-react'
import { useUpdateUser } from '../hooks/useUsers'
import { useBusinesses } from '../hooks/useBusinesses'
import { useAuth } from '../context/AuthContext'

const editSchema = z.object({
  name:       z.string().min(2, 'Mínimo 2 caracteres'),
  email:      z.string().email('Email inválido'),
  password:   z.union([z.string().min(6, 'Mínimo 6 caracteres'), z.literal('')]).optional(),
  businessId: z.string().optional(),
})

const inputCls =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 placeholder-gray-400'

export default function EditUserModal({ targetUser, onClose }) {
  const updateUser = useUpdateUser()
  const { user } = useAuth()
  const [bizSearch, setBizSearch] = useState('')

  // Solo un admin de plataforma puede reasignar el negocio de un usuario
  const canChangeBusiness = user?.role === 'SUPER_ADMIN' && !!targetUser.businessId

  const { data: bizPage, isLoading: bizLoading } = useBusinesses(
    { page: 0, size: 200 },
    { enabled: canChangeBusiness },
  )
  const allBusinesses = useMemo(() => bizPage?.content ?? [], [bizPage])

  const filteredBiz = useMemo(() => {
    const q = bizSearch.toLowerCase()
    return q
      ? allBusinesses.filter(
          (b) => b.name.toLowerCase().includes(q) || b.taxId.includes(q),
        )
      : allBusinesses
  }, [allBusinesses, bizSearch])

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    resolver: zodResolver(editSchema),
    defaultValues: {
      name:       targetUser.name,
      email:      targetUser.email,
      password:   '',
      businessId: targetUser.businessId ?? '',
    },
  })

  const selectedBizId  = watch('businessId')
  const businessChanged = canChangeBusiness && selectedBizId && selectedBizId !== targetUser.businessId

  const onSubmit = async ({ name, email, password, businessId }) => {
    try {
      await updateUser.mutateAsync({
        id: targetUser.id,
        name,
        email,
        ...(password ? { password } : {}),
        ...(canChangeBusiness && businessId && businessId !== targetUser.businessId
          ? { businessId }
          : {}),
      })
      onClose()
    } catch { /* error shown inline */ }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Editar usuario</h3>
            <p className="mt-0.5 text-xs text-gray-400">{targetUser.email}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="space-y-4 px-5 py-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Nombre</label>
              <input {...register('name')} type="text" className={inputCls} />
              {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Email</label>
              <input {...register('email')} type="email" className={inputCls} />
              {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Nueva contraseña{' '}
                <span className="font-normal text-gray-400">(dejar vacío para no cambiar)</span>
              </label>
              <input
                {...register('password')}
                type="password"
                placeholder="••••••••"
                className={inputCls}
              />
              {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
            </div>

            {/* Reasignar negocio — solo admin de plataforma */}
            {canChangeBusiness && (
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-gray-700">
                  <Building2 size={14} className="text-gray-400" />
                  Negocio
                </label>
                {bizLoading ? (
                  <div className="h-9 animate-pulse rounded-lg bg-gray-100" />
                ) : (
                  <>
                    {allBusinesses.length > 10 && (
                      <div className="relative mb-1.5">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Buscar por nombre o RUC..."
                          value={bizSearch}
                          onChange={(e) => setBizSearch(e.target.value)}
                          className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
                        />
                      </div>
                    )}
                    <select {...register('businessId')} className={inputCls}>
                      {filteredBiz.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name} · {b.taxIdType} {b.taxId}
                        </option>
                      ))}
                    </select>
                  </>
                )}
                {businessChanged && (
                  <p className="mt-1.5 rounded-lg bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-700">
                    ⚠️ Vas a mover este usuario a otro negocio: dejará de ver los
                    datos del negocio actual y pasará a operar en el nuevo.
                  </p>
                )}
              </div>
            )}

            {updateUser.isError && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                {updateUser.error?.response?.data?.message ?? 'Error al actualizar el usuario'}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2 border-t border-gray-200 px-5 py-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={updateUser.isPending}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {updateUser.isPending && <Loader2 size={14} className="animate-spin" />}
              {updateUser.isPending ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
