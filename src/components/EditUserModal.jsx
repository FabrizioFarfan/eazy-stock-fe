import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Search } from 'lucide-react'
import { useUpdateUser } from '../hooks/useUsers'
import { useBusinesses } from '../hooks/useBusinesses'
import { useAuth } from '../context/AuthContext'
import EntityModal, { EntityField } from './common/EntityModal'
import { InitialsAvatar } from './boss/BossKit'
import { useT } from '../i18n'

const makeSchema = (t) => z.object({
  name:       z.string().min(2, t('Mínimo 2 caracteres')),
  email:      z.string().email(t('Email inválido')),
  password:   z.union([z.string().min(6, t('Mínimo 6 caracteres')), z.literal('')]).optional(),
  businessId: z.string().optional(),
})

const inputCls =
  'rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 placeholder-gray-400 w-full bg-white'

/**
 * Editar un usuario (empleado u owner). Rediseño 3-oct-2026 sobre EntityModal:
 * cabecera azul con el nombre en vivo, campos grandes, hoja desde abajo en el celular.
 * Solo el admin de plataforma puede moverlo de negocio.
 */
export default function EditUserModal({ targetUser, onClose }) {
  const t = useT()
  const updateUser = useUpdateUser()
  const { user } = useAuth()
  const [bizSearch, setBizSearch] = useState('')
  const editSchema = useMemo(() => makeSchema(t), [t])

  const canChangeBusiness = user?.role === 'SUPER_ADMIN' && !!targetUser.businessId

  const { data: bizPage, isLoading: bizLoading } = useBusinesses(
    { page: 0, size: 200 },
    { enabled: canChangeBusiness },
  )
  const allBusinesses = useMemo(() => bizPage?.content ?? [], [bizPage])
  const filteredBiz = useMemo(() => {
    const q = bizSearch.toLowerCase()
    return q ? allBusinesses.filter((b) => b.name.toLowerCase().includes(q) || b.taxId.includes(q)) : allBusinesses
  }, [allBusinesses, bizSearch])

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    resolver: zodResolver(editSchema),
    defaultValues: { name: targetUser.name, email: targetUser.email, password: '', businessId: targetUser.businessId ?? '' },
  })

  const selectedBizId   = watch('businessId')
  const businessChanged = canChangeBusiness && selectedBizId && selectedBizId !== targetUser.businessId
  const watchedName     = watch('name')

  const onSubmit = async ({ name, email, password, businessId }) => {
    try {
      await updateUser.mutateAsync({
        id: targetUser.id,
        name,
        email,
        ...(password ? { password } : {}),
        ...(canChangeBusiness && businessId && businessId !== targetUser.businessId ? { businessId } : {}),
      })
      onClose()
    } catch { /* error shown inline */ }
  }

  return (
    <EntityModal onClose={onClose} onSubmit={handleSubmit(onSubmit)} isEdit
      title={t('Editar usuario')} avatar={<InitialsAvatar name={watchedName || targetUser.name} light />}
      previewName={watchedName} placeholderName={targetUser.name} subtitle={targetUser.email}
      submitting={updateUser.isPending} submitLabel={t('Guardar cambios')}
      error={updateUser.isError ? (updateUser.error?.response?.data?.message ?? t('Error al actualizar el usuario')) : null}>

      <EntityField label={t('Nombre')} error={errors.name?.message}>
        <input {...register('name')} type="text" className={`${inputCls} py-3 text-base font-semibold`} autoFocus />
      </EntityField>

      <EntityField label={t('Email')} error={errors.email?.message}>
        <input {...register('email')} type="email" className={inputCls} />
      </EntityField>

      <EntityField label={t('Nueva contraseña')} hint={t('Déjala vacía para no cambiarla')} error={errors.password?.message}>
        <input {...register('password')} type="password" placeholder="••••••••" className={inputCls} autoComplete="new-password" />
      </EntityField>

      {canChangeBusiness && (
        <EntityField label={t('Negocio')} hint={t('Solo el admin de plataforma puede moverlo de negocio')}>
          {bizLoading ? (
            <div className="h-11 animate-pulse rounded-xl bg-gray-100" />
          ) : (
            <>
              {allBusinesses.length > 10 && (
                <div className="relative mb-1.5">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="text" placeholder={t('Buscar por nombre o RUC...')} value={bizSearch}
                    onChange={(e) => setBizSearch(e.target.value)} className={`${inputCls} pl-9`} />
                </div>
              )}
              <select {...register('businessId')} className={inputCls}>
                {filteredBiz.map((b) => <option key={b.id} value={b.id}>{b.name} · {b.taxIdType} {b.taxId}</option>)}
              </select>
            </>
          )}
          {businessChanged && (
            <p className="mt-2 rounded-xl bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-700">
              ⚠️ {t('Vas a mover este usuario a otro negocio: dejará de ver los datos del negocio actual y pasará a operar en el nuevo.')}
            </p>
          )}
        </EntityField>
      )}
    </EntityModal>
  )
}
