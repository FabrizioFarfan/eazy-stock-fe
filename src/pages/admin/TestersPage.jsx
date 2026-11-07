import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Copy, Loader2, Smartphone, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useT } from '../../i18n'
import { bossApi } from '../../services/endpoints/boss'
import { ReportHeader, ReportHero } from '../../components/reports/ReportKit'
import { BossSwitcher } from '../../components/boss/BossKit'
import { flagEmoji } from '../../components/boss/bossUtils'
import { getErrorMessage } from '../../utils/handleApiError'

/**
 * Panel Boss › Testers (Frank, 7-nov-2026): quienes se apuntaron desde la web para probar las apps. Se copian los
 * correos para pegarlos en Play Console o TestFlight y se marca a quién ya se le dio acceso.
 */
const GOAL = 14
const PLATFORM = { ANDROID: 'Android', IOS: 'iPhone', BOTH: 'Android y iPhone' }
const FILTERS = [
  { key: 'ALL', label: 'Todos' },
  { key: 'ANDROID', label: 'Android' },
  { key: 'IOS', label: 'iPhone' },
  { key: 'PENDING', label: 'Sin acceso aún' },
]
const matches = (row, filter) => {
  if (filter === 'ALL') return true
  if (filter === 'PENDING') return !row.invitedAt
  return row.platform === filter || row.platform === 'BOTH'
}

export default function TestersPage() {
  const t = useT()
  const qc = useQueryClient()
  const [filter, setFilter] = useState('ALL')
  const { data, isLoading, isError } = useQuery({
    queryKey: ['boss-testers'],
    queryFn: () => bossApi.getTesters().then((r) => r.data.data ?? r.data),
  })
  const rows = useMemo(() => data ?? [], [data])
  const shown = useMemo(() => rows.filter((row) => matches(row, filter)), [rows, filter])
  const android = rows.filter((row) => matches(row, 'ANDROID')).length
  const ios = rows.filter((row) => matches(row, 'IOS')).length
  const refresh = () => qc.invalidateQueries({ queryKey: ['boss-testers'] })

  const invite = useMutation({
    mutationFn: ({ id, invited }) => bossApi.setTesterInvited(id, invited),
    onSuccess: refresh,
    onError: (err) => toast.error(getErrorMessage(err)),
  })
  const remove = useMutation({
    mutationFn: (id) => bossApi.deleteTester(id),
    onSuccess: refresh,
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const copyEmails = async () => {
    try {
      await navigator.clipboard.writeText(shown.map((row) => row.email).join(', '))
      toast.success(t('{n} correos copiados', { n: shown.length }))
    } catch {
      toast.error(t('No se pudo copiar'))
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <ReportHeader icon={Smartphone} title={t('Testers')} subtitle={t('Quienes quieren probar las apps antes de que salgan')} />
      <BossSwitcher />
      <ReportHero icon={Smartphone} label={t('Testers de Android · objetivo {goal}', { goal: GOAL })} value={`${android} / ${GOAL}`}
        sub={<span>{t('Se apuntan en eazy-stock.com/apps y en el Inicio')}</span>}
        cells={[
          [t('En total'), rows.length],
          [t('Android'), android],
          [t('iPhone'), ios],
          [t('Sin acceso aún'), rows.filter((row) => !row.invitedAt).length],
        ]} />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5" role="tablist" aria-label={t('Filtro')}>
          {FILTERS.map((f) => (
            <button key={f.key} type="button" role="tab" aria-selected={filter === f.key} onClick={() => setFilter(f.key)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors ${
                filter === f.key ? 'bg-gray-900 text-white' : 'border border-gray-200 bg-white text-gray-500 hover:bg-gray-50'}`}>
              {t(f.label)}
            </button>
          ))}
        </div>
        <button type="button" onClick={copyEmails} disabled={shown.length === 0} data-testid="testers-copy"
          className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50">
          <Copy size={13} /> {t('Copiar estos correos')}
        </button>
      </div>

      {isLoading && <div className="flex justify-center py-10"><Loader2 className="animate-spin text-gray-400" /></div>}
      {isError && <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-6 text-center text-sm text-red-500">{t('No se pudo cargar la lista')}</div>}
      {!isLoading && !isError && shown.length === 0 && (
        <div className="rounded-2xl border border-gray-100 bg-white px-4 py-10 text-center text-sm text-gray-500">{t('Todavía no hay nadie aquí')}</div>
      )}
      {shown.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white">
          <table className="w-full min-w-[40rem] text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs font-bold uppercase tracking-wider text-gray-400">
                <th className="px-4 py-3">{t('Correo')}</th>
                <th className="px-4 py-3">{t('Teléfono')}</th>
                <th className="px-4 py-3">{t('Se apuntó')}</th>
                <th className="px-4 py-3">{t('Ya tiene acceso')}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {shown.map((row) => (
                <tr key={row.id} data-testid="tester-row">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {row.country && <span className="mr-1.5" aria-hidden="true">{flagEmoji(row.country)}</span>}{row.email}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{t(PLATFORM[row.platform] ?? row.platform)}</td>
                  <td className="px-4 py-3 text-gray-500">{new Date(row.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <input type="checkbox" checked={!!row.invitedAt} aria-label={t('Ya tiene acceso')} className="h-4 w-4"
                      onChange={(e) => invite.mutate({ id: row.id, invited: e.target.checked })} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button type="button" aria-label={t('Quitar de la lista')} title={t('Quitar de la lista')}
                      onClick={() => { if (window.confirm(t('¿Quitar a {email} de la lista?', { email: row.email }))) remove.mutate(row.id) }}
                      className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600">
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
