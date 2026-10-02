import { useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { UserPlus, Users, Search, Trash2, AlertTriangle, ShieldAlert, Building2, CalendarDays, Mail } from 'lucide-react'
import { toast } from 'sonner'
import { useOwners, useCreateOwner, useDeleteOwner } from '../../hooks/useOwners'
import { useBusinesses } from '../../hooks/useBusinesses'
import EditUserModal from '../../components/EditUserModal'
import EntityModal, { EntityField } from '../../components/common/EntityModal'
import { ReportHeader, ReportHero, BigSearch, NewButton, EntityCard } from '../../components/reports/ReportKit'
import { BossSwitcher, InitialsAvatar, Chip, ConfirmCard } from '../../components/boss/BossKit'
import { formatDate, isThisMonth } from '../../components/boss/bossUtils'
import { getErrorMessage, getErrorField } from '../../utils/handleApiError'
import { useT } from '../../i18n'

const inputCls =
  'rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 placeholder-gray-400 w-full bg-white'

// ── form schema ───────────────────────────────────────────────────────────────

const makeSchema = (t) => z.object({
  firstName:  z.string().min(2, t('Mínimo 2 caracteres')),
  lastName:   z.string().min(2, t('Mínimo 2 caracteres')),
  email:      z.string().email(t('Email inválido')),
  password:   z.string().min(6, t('Mínimo 6 caracteres')),
  businessId: z.string().uuid(t('Seleccioná un negocio')),
})

// ── Nuevo owner (EntityModal con vista previa del nombre) ─────────────────────

function CreateOwnerModal({ onClose }) {
  const t = useT()
  const createOwner = useCreateOwner()
  const [bizSearch, setBizSearch] = useState('')
  const schema = useMemo(() => makeSchema(t), [t])

  const { data: bizPage, isLoading: bizLoading } = useBusinesses({ page: 0, size: 200 })
  const allBusinesses = bizPage?.content ?? []
  const filteredBiz = useMemo(() => {
    const q = bizSearch.toLowerCase()
    return q ? allBusinesses.filter((b) => b.name.toLowerCase().includes(q) || b.taxId.includes(q)) : allBusinesses
  }, [allBusinesses, bizSearch])

  const { register, handleSubmit, setError, watch, formState: { errors } } = useForm({ resolver: zodResolver(schema) })
  const previewName = `${watch('firstName') ?? ''} ${watch('lastName') ?? ''}`.trim()
  const previewEmail = watch('email')

  const onSubmit = async ({ firstName, lastName, email, password, businessId }) => {
    try {
      await createOwner.mutateAsync({ name: `${firstName} ${lastName}`.trim(), email, password, businessId })
      toast.success(t('Owner creado'))
      onClose()
    } catch (err) {
      const field = getErrorField(err)
      if (field && ['email', 'password', 'businessId'].includes(field)) {
        setError(field, { type: 'server', message: getErrorMessage(err) })
      }
    }
  }

  const serverError = createOwner.isError && !getErrorField(createOwner.error) ? getErrorMessage(createOwner.error) : null

  return (
    <EntityModal onClose={onClose} onSubmit={handleSubmit(onSubmit)} isEdit={false}
      title={t('Nuevo Owner')} avatar={<InitialsAvatar name={previewName || '?'} light />}
      previewName={previewName} placeholderName={t('Nombre del dueño')}
      subtitle={previewEmail || t('El correo con el que va a entrar')}
      submitting={createOwner.isPending} submitLabel={t('Crear Owner')} error={serverError}>

      <div className="grid grid-cols-2 gap-3">
        <EntityField label={`${t('Nombre')} *`} error={errors.firstName?.message}>
          <input {...register('firstName')} placeholder="Juan" className={`${inputCls} py-3 text-base font-semibold`} autoFocus />
        </EntityField>
        <EntityField label={`${t('Apellido')} *`} error={errors.lastName?.message}>
          <input {...register('lastName')} placeholder="Pérez" className={`${inputCls} py-3 text-base font-semibold`} />
        </EntityField>
      </div>

      <EntityField label={`${t('Email')} *`} error={errors.email?.message}>
        <input {...register('email')} type="email" placeholder="owner@negocio.com" className={inputCls} />
      </EntityField>

      <EntityField label={`${t('Contraseña')} *`} hint={t('Mínimo 6 caracteres · se la pasas tú al dueño')} error={errors.password?.message}>
        <input {...register('password')} type="password" placeholder="••••••••" className={inputCls} autoComplete="new-password" />
      </EntityField>

      <EntityField label={`${t('Negocio')} *`} error={errors.businessId?.message}>
        {bizLoading ? (
          <div className="h-11 animate-pulse rounded-xl bg-gray-100" />
        ) : allBusinesses.length === 0 ? (
          <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-700">
            {t('No hay negocios creados todavía. Crea uno primero desde "Negocios".')}
          </p>
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
              <option value="">{t('— Seleccioná un negocio —')}</option>
              {filteredBiz.map((b) => <option key={b.id} value={b.id}>{b.name} · {b.taxIdType} {b.taxId}</option>)}
            </select>
          </>
        )}
      </EntityField>
    </EntityModal>
  )
}

// ── Eliminar owner (PERMANENTE; el BE lo bloquea si ya tiene actividad) ───────

function DeleteOwnerModal({ owner, onClose }) {
  const t = useT()
  const deleteOwner = useDeleteOwner()
  const [confirmEmail, setConfirmEmail] = useState('')
  const matches = confirmEmail.trim().toLowerCase() === owner.email.toLowerCase()

  const onConfirm = async () => {
    if (!matches) return
    try {
      await deleteOwner.mutateAsync({ id: owner.id, confirmEmail: confirmEmail.trim() })
      toast.success(t('Owner {name} eliminado permanentemente', { name: owner.name }))
      onClose()
    } catch { /* error mostrado inline */ }
  }

  return (
    <ConfirmCard icon={ShieldAlert} tone="red" title={t('Eliminar owner permanentemente')} onClose={onClose}
      onConfirm={onConfirm} confirmLabel={t('Eliminar definitivamente')} pending={deleteOwner.isPending} disabled={!matches}>
      <div className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50 p-3">
        <InitialsAvatar name={owner.name} />
        <div className="min-w-0">
          <p className="truncate font-bold text-gray-900">{owner.name}</p>
          <p className="truncate text-xs text-gray-500">{owner.email}</p>
          {owner.businessName && <p className="truncate text-xs text-gray-400">{owner.businessName}</p>}
        </div>
      </div>
      <div className="flex gap-2.5 rounded-2xl border border-amber-100 bg-amber-50 px-3.5 py-3 text-xs leading-relaxed text-amber-700">
        <AlertTriangle size={15} className="mt-0.5 flex-shrink-0" />
        <div>
          <p>{t('La cuenta y sus accesos se borran de forma definitiva.')}</p>
          <p className="mt-1">{t('Si el owner ya registró ventas, stock o compras, la eliminación se bloquea automáticamente — en ese caso solo puede desactivarse.')}</p>
        </div>
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-bold text-gray-800">{t('Escribe el email del owner para confirmar')}</label>
        <input type="email" value={confirmEmail} onChange={(e) => setConfirmEmail(e.target.value)} placeholder={owner.email} autoComplete="off"
          className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/20 placeholder-gray-300" />
      </div>
      {deleteOwner.isError && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 ring-1 ring-red-100">{getErrorMessage(deleteOwner.error)}</p>
      )}
    </ConfirmCard>
  )
}

// ── Página ────────────────────────────────────────────────────────────────────

export default function OwnersPage() {
  const t = useT()
  const [showModal, setShowModal]       = useState(false)
  const [editTarget, setEditTarget]     = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [q, setQ] = useState('')

  // Pocos owners (plataforma joven): se traen todos y se filtra en el navegador.
  const { data, isLoading } = useOwners({ page: 0, size: 200, sort: 'createdAt,desc' })
  const all = data?.content ?? []

  const list = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return all
    return all.filter((u) => u.name.toLowerCase().includes(s) || u.email.toLowerCase().includes(s) || u.businessName?.toLowerCase().includes(s))
  }, [all, q])

  const withBiz   = all.filter((u) => u.businessName).length
  const bizCount  = new Set(all.map((u) => u.businessId).filter(Boolean)).size
  const newMonth  = all.filter((u) => isThisMonth(u.createdAt)).length

  return (
    <div className="flex flex-col gap-5">
      <ReportHeader icon={Users} title={t('Owners')} subtitle={t('Los dueños de cada negocio y con qué correo entran')}
        right={<NewButton onClick={() => setShowModal(true)}><UserPlus size={16} />{t('Nuevo Owner')}</NewButton>} />

      <BossSwitcher />

      <ReportHero icon={Users} label={t('Owners activos')} value={all.length} loading={isLoading}
        sub={<span>{t('Cada owner manda en su negocio: productos, ventas, equipo y permisos')}</span>}
        cells={[
          [t('Con negocio'), withBiz],
          [t('Sin negocio'), all.length - withBiz, all.length - withBiz > 0 ? 'text-amber-200' : ''],
          [t('Negocios distintos'), bizCount],
          [t('Nuevos este mes'), newMonth],
        ]} />

      <BigSearch value={q} onChange={setQ} placeholder={t('Buscar por nombre, correo o negocio...')} />

      {isLoading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-36 animate-pulse rounded-2xl bg-gray-100" />)}
        </div>
      ) : list.length === 0 ? (
        <div className="rounded-2xl border border-gray-100 bg-white px-4 py-12 text-center shadow-sm">
          <p className="text-sm font-semibold text-gray-700">{q ? t('Ningún owner coincide con «{q}»', { q }) : t('No hay owners registrados')}</p>
          {q && <button type="button" onClick={() => setQ('')} className="mt-2 text-xs font-semibold text-blue-600 hover:underline">{t('Ver todos')}</button>}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((u) => (
            <EntityCard key={u.id} avatar={<InitialsAvatar name={u.name} />} title={u.name}
              subtitle={<span className="flex items-center gap-1 truncate"><Mail size={11} className="flex-shrink-0" />{u.email}</span>}
              onOpen={() => setEditTarget(u)} onEdit={() => setEditTarget(u)} onDelete={() => setDeleteTarget(u)}>
              <div className="flex flex-wrap gap-1.5">
                {u.businessName
                  ? <Chip icon={Building2} tone="blue">{u.businessName}</Chip>
                  : <Chip icon={Building2} tone="amber">{t('Sin negocio')}</Chip>}
                <Chip tone={u.active ? 'emerald' : 'red'}>{u.active ? t('Activo') : t('Inactivo')}</Chip>
              </div>
              <p className="flex items-center gap-1 text-[11px] text-gray-400">
                <CalendarDays size={11} /> {t('Registrado el {date}', { date: formatDate(u.createdAt) })}
              </p>
            </EntityCard>
          ))}
        </div>
      )}

      <p className="flex items-center justify-center gap-1.5 text-center text-xs text-gray-300">
        <Trash2 size={12} /> {t('Eliminar solo funciona con owners sin actividad; los demás se desactivan desde Editar.')}
      </p>

      {showModal && <CreateOwnerModal onClose={() => setShowModal(false)} />}
      {editTarget && <EditUserModal targetUser={editTarget} onClose={() => setEditTarget(null)} />}
      {deleteTarget && <DeleteOwnerModal owner={deleteTarget} onClose={() => setDeleteTarget(null)} />}
    </div>
  )
}
