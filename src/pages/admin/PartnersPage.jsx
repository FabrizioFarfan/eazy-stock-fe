import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Crown, Users, Building2, Mail, CalendarDays, ShieldCheck, ArrowRight, Info } from 'lucide-react'
import { bossApi } from '../../services/endpoints/boss'
import { useAuth } from '../../context/AuthContext'
import EditUserModal from '../../components/EditUserModal'
import { ReportHeader, ReportHero, EntityCard } from '../../components/reports/ReportKit'
import { KindChip, KindPicker } from '../../components/boss/AccountKind'
import { useAccountKinds } from '../../components/boss/accountKindData'
import { BossSwitcher, InitialsAvatar, Chip } from '../../components/boss/BossKit'
import { formatDate } from '../../components/boss/bossUtils'
import { useT } from '../../i18n'

/**
 * SOCIOS (Frank, 4-nov-2026): «los que tienen la etiqueta socios que estén en otra página, que se llame SOCIOS, y
 * ahí nos vemos, y sé quiénes tienen el poder de hacer todo lo que yo hago en el dashboard».
 *  - Jefes: cuentas BOSS (y SUPER_ADMIN): ven y tocan todo el panel, igual que Frank.
 *  - Socios: dueños de negocio marcados «Socio» (la E.L.C. con su propio negocio de prueba o de trabajo).
 * Mover una cuenta a Cliente / Tester la devuelve a Usuarios.
 */
export default function PartnersPage() {
  const t = useT()
  const { user } = useAuth()
  const [editTarget, setEditTarget] = useState(null)
  const kinds = useAccountKinds()

  const { data, isLoading } = useQuery({
    queryKey: ['boss-team'],
    queryFn: () => bossApi.getTeam().then((r) => r.data.data ?? r.data),
    enabled: !!user?.isBoss,
  })
  const bosses = data?.bosses ?? []
  const partners = data?.partners ?? []

  return (
    <div className="flex flex-col gap-5">
      <ReportHeader icon={Crown} title={t('Socios')} subtitle={t('Quién manda en la plataforma y quién es del equipo')} />

      <BossSwitcher />

      <ReportHero icon={Crown} label={t('Socios')} value={bosses.length + partners.length} loading={isLoading}
        sub={<span>{t('Los jefes pueden todo lo que tú puedes en el panel; los socios son del equipo y tienen su propio negocio.')}</span>}
        cells={[
          [t('Jefes'), bosses.length],
          [t('Socios con negocio'), partners.length],
        ]} />

      {/* Jefes */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <ShieldCheck size={16} className="text-amber-600" />
          <h3 className="text-sm font-bold text-gray-900">{t('Jefes')}</h3>
          <span className="text-xs text-gray-400">· {t('ven y tocan todo el panel, igual que tú')}</span>
        </div>
        {isLoading ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-28 animate-pulse rounded-2xl bg-gray-100" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {bosses.map((u) => (
              <div key={u.id} className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-white p-4 shadow-sm" data-testid="boss-card">
                <InitialsAvatar name={u.name} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-gray-900">{u.name}{u.id === user?.id && <span className="ml-1.5 text-xs font-semibold text-amber-700">· {t('tú')}</span>}</p>
                  <p className="flex items-center gap-1 truncate text-xs text-gray-500"><Mail size={11} className="flex-shrink-0" />{u.email}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Chip icon={Crown} tone="amber">{u.role === 'BOSS' ? t('Jefe') : t('Super admin')}</Chip>
                    {u.email === data?.systemAdminEmail && <Chip tone="gray">{t('Cuenta de sistema')}</Chip>}
                    <Chip tone={u.active ? 'emerald' : 'red'}>{u.active ? t('Activo') : t('Inactivo')}</Chip>
                  </div>
                  <p className="mt-1.5 flex items-center gap-1 text-[11px] text-gray-400">
                    <CalendarDays size={11} /> {t('Desde el {date}', { date: formatDate(u.createdAt) })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
        <p className="flex items-start gap-2 rounded-xl bg-gray-50 px-3 py-2 text-[11px] leading-relaxed text-gray-500">
          <Info size={13} className="mt-0.5 flex-shrink-0" />
          <span>
            {t('El poder de jefe no se da desde aquí: se añade el correo en la configuración del servidor (APP_BOSS_EMAILS) y la cuenta pasa a jefe al reiniciar el API.')}{' '}
            {t('La «cuenta de sistema» la crea el propio API al arrancar y sirve de llave de repuesto (y para las comprobaciones de Claudio): no se puede borrar, volvería sola.')}
          </span>
        </p>
      </section>

      {/* Socios con negocio */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Users size={16} className="text-amber-600" />
          <h3 className="text-sm font-bold text-gray-900">{t('Socios con negocio')}</h3>
          <span className="text-xs text-gray-400">· {t('cuentas del equipo con su propia tienda; no cuentan como clientes')}</span>
        </div>
        {isLoading ? (
          <div className="h-28 animate-pulse rounded-2xl bg-gray-100" />
        ) : partners.length === 0 ? (
          <div className="rounded-2xl border border-gray-100 bg-white px-4 py-10 text-center shadow-sm">
            <p className="text-sm font-semibold text-gray-700">{t('Ningún socio todavía.')}</p>
            <p className="mt-1 text-xs text-gray-400">{t('Marca una cuenta como «Socio» en Usuarios y aparecerá aquí.')}</p>
            <Link to="/admin/usuarios" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline">{t('Ir a Usuarios')} <ArrowRight size={12} /></Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {partners.map((u) => (
              <EntityCard key={u.id} avatar={<InitialsAvatar name={u.name} />} title={u.name}
                subtitle={<span className="flex items-center gap-1 truncate"><Mail size={11} className="flex-shrink-0" />{u.email}</span>}
                onOpen={() => setEditTarget(u)} onEdit={() => setEditTarget(u)}>
                <div className="flex flex-wrap gap-1.5">
                  {u.businessName
                    ? <Chip icon={Building2} tone="blue">{u.businessName}</Chip>
                    : <Chip icon={Building2} tone="amber">{t('Sin negocio')}</Chip>}
                  <Chip tone={u.active ? 'emerald' : 'red'}>{u.active ? t('Activo') : t('Inactivo')}</Chip>
                  <KindChip kind="TEAM" />
                </div>
                <p className="flex items-center gap-1 text-[11px] text-gray-400">
                  <CalendarDays size={11} /> {t('Registrado el {date}', { date: formatDate(u.createdAt) })}
                </p>
                {kinds.enabled && (
                  <KindPicker kind="TEAM" busy={kinds.busyId === u.id} onPick={(k) => kinds.pick(u.id, k)} />
                )}
              </EntityCard>
            ))}
          </div>
        )}
      </section>

      {editTarget && <EditUserModal targetUser={editTarget} onClose={() => setEditTarget(null)} />}
    </div>
  )
}
