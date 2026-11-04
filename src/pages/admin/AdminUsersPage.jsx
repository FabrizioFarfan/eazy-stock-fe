import { useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import { UserPlus, Users, Search, Trash2, AlertTriangle, ShieldAlert, Building2, CalendarDays, Mail, Crown, ArrowRight, MailCheck, MailWarning } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { bossApi } from '../../services/endpoints/boss'
import { toast } from 'sonner'
import { useOwners, useCreateOwner, useDeleteOwner } from '../../hooks/useOwners'
import { useBusinesses } from '../../hooks/useBusinesses'
import EditUserModal from '../../components/EditUserModal'
import EntityModal, { EntityField } from '../../components/common/EntityModal'
import { ReportHeader, ReportHero, BigSearch, NewButton, EntityCard } from '../../components/reports/ReportKit'
import { KindChip, KindPicker, KindTabs } from '../../components/boss/AccountKind'
import { useAccountKinds } from '../../components/boss/accountKindData'
import { matchesFilter, countKinds, USER_FILTERS } from '../../utils/accountKinds'
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
      toast.success(t('Usuario creado'))
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
      title={t('Nuevo usuario')} avatar={<InitialsAvatar name={previewName || '?'} light />}
      previewName={previewName} placeholderName={t('Nombre del dueño')}
      subtitle={previewEmail || t('El correo con el que va a entrar')}
      submitting={createOwner.isPending} submitLabel={t('Crear usuario')} error={serverError}>

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
  // 4-nov-2026 (Frank): las cuentas de prueba se borran DE VERDAD, con su negocio y todos sus datos.
  const [withData, setWithData] = useState(!!owner.businessName)
  const matches = confirmEmail.trim().toLowerCase() === owner.email.toLowerCase()

  const onConfirm = async () => {
    if (!matches) return
    try {
      await deleteOwner.mutateAsync({ id: owner.id, confirmEmail: confirmEmail.trim(), withData })
      toast.success(withData ? t('Cuenta {name} eliminada con su negocio y todos sus datos', { name: owner.name }) : t('Owner {name} eliminado permanentemente', { name: owner.name }))
      onClose()
    } catch { /* error mostrado inline */ }
  }

  return (
    <ConfirmCard icon={ShieldAlert} tone="red" title={t('Eliminar cuenta permanentemente')} onClose={onClose}
      onConfirm={onConfirm} confirmLabel={withData ? t('Borrar cuenta, negocio y datos') : t('Eliminar definitivamente')} pending={deleteOwner.isPending} disabled={!matches}>
      <div className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50 p-3">
        <InitialsAvatar name={owner.name} />
        <div className="min-w-0">
          <p className="truncate font-bold text-gray-900">{owner.name}</p>
          <p className="truncate text-xs text-gray-500">{owner.email}</p>
          {owner.businessName && <p className="truncate text-xs text-gray-400">{owner.businessName}</p>}
        </div>
      </div>
      <label className={`flex cursor-pointer gap-2.5 rounded-2xl border px-3.5 py-3 text-xs leading-relaxed ${withData ? 'border-red-200 bg-red-50 text-red-800' : 'border-gray-200 bg-white text-gray-600'}`} data-testid="delete-with-data">
        <input type="checkbox" checked={withData} onChange={(e) => setWithData(e.target.checked)} className="mt-0.5 accent-red-600" />
        <span>
          <span className="block font-bold">{t('Borrar también su negocio y TODOS sus datos')}</span>
          <span className="block">{t('Productos, ventas, compras, clientes, empleados y suscripción: todo se va ya mismo, sin los 30 días de gracia. Es lo que quieres para una cuenta de prueba; no se puede deshacer.')}</span>
        </span>
      </label>
      {!withData && (
        <div className="flex gap-2.5 rounded-2xl border border-amber-100 bg-amber-50 px-3.5 py-3 text-xs leading-relaxed text-amber-700">
          <AlertTriangle size={15} className="mt-0.5 flex-shrink-0" />
          <p>{t('Sin esa casilla solo se borra la cuenta: si tiene un negocio (aunque esté desactivado) o actividad, se bloquea.')}</p>
        </div>
      )}
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

/**
 * USUARIOS (antes «Owners»; Frank, 4-nov-2026): las cuentas dueñas de negocio que NO son del equipo. Cada una
 * lleva su etiqueta (cliente / tester / sin revisar) y el BOSS la cambia aquí mismo, también en las cuentas que
 * no son dueñas de ningún negocio (un segundo dueño sumado a un negocio ya existente: antes no se podía
 * clasificar porque la etiqueta salía del negocio). Los Socios viven en su propia página.
 */
export default function AdminUsersPage() {
  const t = useT()
  const [showModal, setShowModal]       = useState(false)
  const [editTarget, setEditTarget]     = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [q, setQ] = useState('')

  // Pocos owners (plataforma joven): se traen todos y se filtra en el navegador.
  const { data, isLoading } = useOwners({ page: 0, size: 200, sort: 'createdAt,desc' })
  const all = data?.content ?? []

  // 30-oct-2026 (Frank): de un vistazo, quién es cliente, tester o socio (solo BOSS; un owner sin negocio no sale en el panel).
  const kinds = useAccountKinds()
  const [tab, setTab] = useState('customers') // Frank: siempre se abre en Clientes
  // 4-nov-2026: las cuentas de prueba no tienen buzón; el BOSS da el correo por confirmado desde aquí.
  const qc = useQueryClient()
  const verifyEmail = useMutation({
    mutationFn: (id) => bossApi.verifyEmail(id),
    onSuccess: (_r, id) => { toast.success(t('Correo confirmado')); qc.invalidateQueries({ queryKey: ['owners'] }); void id },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
  // La etiqueta viene en la propia cuenta (API 1.21.0); si falta, la del negocio del que es dueño.
  const kindOfOwner = (u) => (u.accountKind !== undefined ? u.accountKind : kinds.byOwner.get(u.id)) ?? null
  // Los socios (TEAM) tienen su página: aquí no se mezclan con los clientes.
  const partners = useMemo(() => all.filter((u) => kindOfOwner(u) === 'TEAM'), [all, kinds.byOwner]) // eslint-disable-line react-hooks/exhaustive-deps
  const users = useMemo(() => all.filter((u) => kindOfOwner(u) !== 'TEAM'), [all, kinds.byOwner]) // eslint-disable-line react-hooks/exhaustive-deps

  const list = useMemo(() => {
    const s = q.trim().toLowerCase()
    const byTab = kinds.enabled ? users.filter((u) => matchesFilter(kindOfOwner(u), tab)) : users
    if (!s) return byTab
    return byTab.filter((u) => u.name.toLowerCase().includes(s) || u.email.toLowerCase().includes(s) || u.businessName?.toLowerCase().includes(s))
  }, [users, q, tab, kinds.enabled]) // eslint-disable-line react-hooks/exhaustive-deps

  const withBiz   = users.filter((u) => u.businessName).length
  const bizCount  = new Set(users.map((u) => u.businessId).filter(Boolean)).size
  const newMonth  = users.filter((u) => isThisMonth(u.createdAt)).length
  const unreviewed = users.filter((u) => kindOfOwner(u) === null).length

  return (
    <div className="flex flex-col gap-5">
      <ReportHeader icon={Users} title={t('Usuarios')} subtitle={t('Las cuentas que usan Eazy Stock: clientes, testers y las que faltan revisar')}
        right={<NewButton onClick={() => setShowModal(true)}><UserPlus size={16} />{t('Nuevo usuario')}</NewButton>} />

      <BossSwitcher />

      <ReportHero icon={Users} label={t('Usuarios')} value={users.length} loading={isLoading}
        sub={<span>{t('Cada usuario manda en su negocio: productos, ventas, equipo y permisos. Los socios están en su página.')}</span>}
        cells={[
          [t('Sin revisar'), unreviewed, unreviewed > 0 ? 'text-amber-200' : ''],
          [t('Con negocio'), withBiz],
          [t('Negocios distintos'), bizCount],
          [t('Nuevos este mes'), newMonth],
        ]} />

      {kinds.enabled && partners.length > 0 && (
        <Link to="/admin/socios" className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 transition-colors hover:bg-amber-100">
          <Crown size={16} className="flex-shrink-0 text-amber-600" />
          <span className="flex-1">{partners.length === 1 ? t('1 cuenta es de un socio: está en Socios.') : t('{n} cuentas son de socios: están en Socios.', { n: partners.length })}</span>
          <ArrowRight size={15} />
        </Link>
      )}

      <BigSearch value={q} onChange={setQ} placeholder={t('Buscar por nombre, correo o negocio...')} />

      {kinds.enabled && <KindTabs value={tab} onChange={setTab} counts={countKinds(users, kindOfOwner)} filters={USER_FILTERS} />}

      {isLoading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-36 animate-pulse rounded-2xl bg-gray-100" />)}
        </div>
      ) : list.length === 0 ? (
        <div className="rounded-2xl border border-gray-100 bg-white px-4 py-12 text-center shadow-sm">
          <p className="text-sm font-semibold text-gray-700">{q ? t('Ningún usuario coincide con «{q}»', { q }) : tab !== 'all' ? t('Ninguna cuenta en esta pestaña todavía.') : t('No hay usuarios registrados')}</p>
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
                {kinds.enabled && <KindChip kind={kindOfOwner(u)} />}
                {u.emailVerified === false && (
                  <button type="button" disabled={verifyEmail.isPending} onClick={(e) => { e.stopPropagation(); verifyEmail.mutate(u.id) }}
                    title={t('Esta cuenta no confirmó su correo: el API la bloquea. Toca para darlo por confirmado (cuentas de prueba).')}
                    className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-600 ring-1 ring-red-100 hover:bg-red-100 disabled:opacity-50">
                    <MailWarning size={11} /> {t('Correo sin confirmar · confirmar')}
                  </button>
                )}
                {u.emailVerified === true && <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600" title={t('Correo confirmado')}><MailCheck size={11} /></span>}
              </div>
              <p className="flex items-center gap-1 text-[11px] text-gray-400">
                <CalendarDays size={11} /> {t('Registrado el {date}', { date: formatDate(u.createdAt) })}
              </p>
              {kinds.enabled && (
                <KindPicker kind={kindOfOwner(u)} busy={kinds.busyId === u.id} onPick={(k) => kinds.pick(u.id, k)} />
              )}
            </EntityCard>
          ))}
        </div>
      )}

      <p className="flex items-center justify-center gap-1.5 text-center text-xs text-gray-300">
        <Trash2 size={12} /> {t('Eliminar borra la cuenta; con la casilla «Borrar también su negocio y todos sus datos» se va con todo, ya mismo.')}
      </p>

      {showModal && <CreateOwnerModal onClose={() => setShowModal(false)} />}
      {editTarget && <EditUserModal targetUser={editTarget} onClose={() => setEditTarget(null)} />}
      {deleteTarget && <DeleteOwnerModal owner={deleteTarget} onClose={() => setDeleteTarget(null)} />}
    </div>
  )
}
