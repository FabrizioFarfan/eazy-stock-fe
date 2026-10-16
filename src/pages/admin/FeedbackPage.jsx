import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { MessageSquareHeart, RefreshCw, Loader2, Inbox, MessageCircle, Mail, Gift, Store, Pencil, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import { feedbackApi } from '../../services/endpoints/feedback'
import { getErrorMessage } from '../../utils/handleApiError'
import { whatsappDigits } from '../../utils/phone'
import { useT } from '../../i18n'
import EntityModal, { EntityField } from '../../components/common/EntityModal'
import { ReportHeader, ReportHero } from '../../components/reports/ReportKit'
import { BossSwitcher, FlagAvatar, Chip, BOSS_FEEDBACK_SUMMARY_KEY } from '../../components/boss/BossKit'
import { STATUS_LABEL as SUB_STATUS_LABEL, STATUS_TONE as SUB_STATUS_TONE } from '../../components/subscription/subscriptionUtils'
import { Stars } from '../../components/feedback/FeedbackKit'
import {
  TOPIC_LABEL, STATUSES, BOSS_STATUS_LABEL, STATUS_TONE, REWARDS, REWARD_LABEL, ROLE_LABEL, formatWhen,
} from '../../components/feedback/feedbackUtils'

/**
 * Boss › Feedback (Frank, 16-oct-2026): todo lo que la gente escribe desde
 * Ajustes › Tu opinión. Cabecera con nuevos/total/promedio, pestañas Nuevos/Todos,
 * tarjetas con el mensaje completo y un modal para estado, respuesta al usuario,
 * nota interna y recompensa (que se aplica a mano en Boss › Suscripciones).
 */

export const BOSS_FEEDBACK_KEY = 'boss-feedback'
const unwrap = (r) => r.data?.data ?? r.data
const inputCls = 'w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 placeholder-gray-400'

function EditFeedbackModal({ row, onClose }) {
  const t = useT()
  const qc = useQueryClient()
  const [status, setStatus] = useState(row.status ?? 'NEW')
  const [bossReply, setBossReply] = useState(row.bossReply ?? '')
  const [bossNote, setBossNote] = useState(row.bossNote ?? '')
  const [reward, setReward] = useState(row.reward ?? 'NONE')
  const [rewardNote, setRewardNote] = useState(row.rewardNote ?? '')

  const update = useMutation({
    mutationFn: (data) => feedbackApi.bossUpdateFeedback(row.id, data).then(unwrap),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [BOSS_FEEDBACK_KEY] })
      qc.invalidateQueries({ queryKey: [BOSS_FEEDBACK_SUMMARY_KEY] })
      toast.success(t('Comentario actualizado'))
      onClose()
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const onSubmit = (e) => {
    e.preventDefault()
    // El BE pasa a REPLIED solo cuando llega respuesta; si el boss la borra, se manda "" para vaciarla.
    update.mutate({ status, bossReply, bossNote, reward, rewardNote: reward === 'OTRO' ? rewardNote : '' })
  }

  const subtitle = [row.businessName, row.authorRole ? t(ROLE_LABEL[row.authorRole] ?? row.authorRole) : null, row.authorEmail].filter(Boolean).join(' · ')

  return (
    <EntityModal onClose={onClose} onSubmit={onSubmit} isEdit
      title={t('Feedback')} previewName={row.authorName || row.businessName} placeholderName={t('Usuario')}
      subtitle={subtitle} avatar={<FlagAvatar code={row.countryCode} light />}
      submitting={update.isPending} submitLabel={t('Guardar cambios')}>
      <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
            <span>{formatWhen(row.createdAt)}</span>
            {row.topic && <Chip tone="gray">{t(TOPIC_LABEL[row.topic] ?? row.topic)}</Chip>}
            {row.wantsContact && <Chip tone="emerald" icon={MessageCircle}>{t('Quiere que le escriban por WhatsApp')}</Chip>}
          </div>
          {row.rating > 0 ? <Stars value={row.rating} size={14} /> : <span className="text-xs text-gray-400">{t('Sin puntuar')}</span>}
        </div>
        <p className="mt-2 whitespace-pre-wrap text-sm text-gray-800">{row.message}</p>
      </div>

      <EntityField label={t('Estado')}>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputCls}>
          {STATUSES.map((s) => <option key={s} value={s}>{t(BOSS_STATUS_LABEL[s])}</option>)}
        </select>
      </EntityField>
      <EntityField label={t('Respuesta al usuario')} hint={t('La ve el usuario en Ajustes › Tu opinión')}>
        <textarea rows={3} value={bossReply} onChange={(e) => setBossReply(e.target.value)} className={inputCls} maxLength={2000} />
      </EntityField>
      <EntityField label={t('Nota interna')} hint={t('Solo la ves tú')}>
        <textarea rows={2} value={bossNote} onChange={(e) => setBossNote(e.target.value)} className={inputCls} maxLength={2000} />
      </EntityField>
      <EntityField label={t('Recompensa')}>
        <select value={reward} onChange={(e) => setReward(e.target.value)} className={inputCls}>
          {REWARDS.map((r) => <option key={r} value={r}>{t(REWARD_LABEL[r])}</option>)}
        </select>
      </EntityField>
      {reward === 'OTRO' && (
        <EntityField label={t('Detalle de la recompensa')}>
          <input value={rewardNote} onChange={(e) => setRewardNote(e.target.value)} className={inputCls} maxLength={255} />
        </EntityField>
      )}
      <p className="flex flex-wrap items-center gap-x-2 rounded-xl bg-amber-50 px-3.5 py-3 text-xs text-amber-800 ring-1 ring-amber-100">
        <Gift size={13} className="flex-shrink-0" />
        <span>{t('La recompensa se aplica a mano en Boss › Suscripciones (precio especial o +1 mes)')}</span>
        <Link to="/boss/suscripciones" onClick={onClose} className="inline-flex items-center gap-1 font-bold underline-offset-2 hover:underline">
          {t('Ir a Suscripciones')} <ExternalLink size={11} />
        </Link>
      </p>
    </EntityModal>
  )
}

function Row({ row, onEdit }) {
  const t = useT()
  const wa = row.wantsContact && row.businessPhone ? whatsappDigits(row.businessPhone, row.countryCode) : null
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm lg:flex-row lg:items-start">
      <button type="button" onClick={() => onEdit(row)} className="flex min-w-0 flex-1 items-start gap-3 text-left">
        <FlagAvatar code={row.countryCode} className="!h-11 !w-11" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate font-bold leading-tight text-gray-900">{row.authorName || row.businessName}</p>
            {row.authorRole && <span className="text-xs text-gray-400">· {t(ROLE_LABEL[row.authorRole] ?? row.authorRole)}</span>}
            <Chip tone={STATUS_TONE[row.status] ?? 'gray'}>{t(BOSS_STATUS_LABEL[row.status] ?? row.status)}</Chip>
            {row.topic && <Chip tone="gray">{t(TOPIC_LABEL[row.topic] ?? row.topic)}</Chip>}
            {row.reward && row.reward !== 'NONE' && <Chip tone="amber" icon={Gift}>{t(REWARD_LABEL[row.reward] ?? row.reward)}</Chip>}
          </div>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-xs text-gray-500">
            <Store size={12} className="text-gray-400" />
            <span className="font-semibold text-gray-700">{row.businessName || '—'}</span>
            {row.subscriptionStatus && (
              <Chip tone={SUB_STATUS_TONE[row.subscriptionStatus] ?? 'gray'}>
                {t(SUB_STATUS_LABEL[row.subscriptionStatus] ?? row.subscriptionStatus)}{row.subscriptionPlan ? ` · ${row.subscriptionPlan}` : ''}
              </Chip>
            )}
            <span className="text-gray-400">· {formatWhen(row.createdAt)}</span>
          </p>
          <div className="mt-1.5 flex items-center gap-2">
            {row.rating > 0 ? <Stars value={row.rating} size={14} /> : <span className="text-xs text-gray-400">{t('Sin puntuar')}</span>}
            {row.wantsContact && <Chip tone="emerald" icon={MessageCircle}>WhatsApp</Chip>}
          </div>
          <p className="mt-2 whitespace-pre-wrap text-sm text-gray-800">{row.message}</p>
          {row.bossReply && (
            <p className="mt-2 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-900">
              <span className="font-bold">{t('Respuesta al usuario')}:</span> {row.bossReply}
            </p>
          )}
          {row.bossNote && <p className="mt-1 truncate text-xs italic text-gray-400">“{row.bossNote}”</p>}
        </div>
      </button>
      <div className="flex flex-wrap items-center gap-1.5 lg:flex-shrink-0">
        {wa && (
          <a href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer" title={row.businessPhone}
            className="inline-flex items-center gap-1 rounded-xl border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100">
            <MessageCircle size={13} /> WhatsApp
          </a>
        )}
        {(row.authorEmail || row.ownerEmail) && (
          <a href={`mailto:${row.authorEmail || row.ownerEmail}`} title={row.authorEmail || row.ownerEmail}
            className="inline-flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50">
            <Mail size={13} />
          </a>
        )}
        <button type="button" onClick={() => onEdit(row)}
          className="inline-flex items-center gap-1 rounded-xl bg-blue-600 px-2.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700">
          <Pencil size={13} /> {t('Responder')}
        </button>
      </div>
    </div>
  )
}

export default function FeedbackPage() {
  const t = useT()
  const [tab, setTab] = useState('NEW')
  const [editTarget, setEditTarget] = useState(null)

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: [BOSS_FEEDBACK_KEY],
    queryFn: () => feedbackApi.bossListFeedback().then(unwrap),
  })
  const { data: summary, isLoading: loadingSummary } = useQuery({
    queryKey: [BOSS_FEEDBACK_SUMMARY_KEY],
    queryFn: () => feedbackApi.bossFeedbackSummary().then(unwrap),
  })

  const all = useMemo(() => (Array.isArray(data) ? data : []), [data])
  const list = useMemo(() => (tab === 'NEW' ? all.filter((r) => r.status === 'NEW') : all), [all, tab])
  const newCount = summary?.newCount ?? all.filter((r) => r.status === 'NEW').length
  const total = summary?.total ?? all.length
  const avg = summary?.avgRating != null ? Number(summary.avgRating).toFixed(1) : '—'
  const replied = all.filter((r) => r.status === 'REPLIED').length
  const wantContact = all.filter((r) => r.wantsContact).length

  const tabs = [['NEW', t('Nuevos'), newCount], ['ALL', t('Todos'), total]]

  return (
    <div className="flex flex-col gap-5">
      <ReportHeader icon={MessageSquareHeart} title={t('Feedback')} subtitle={t('Lo que la gente nos cuenta desde Ajustes › Tu opinión')}
        right={(
          <button type="button" onClick={() => refetch()}
            className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-50">
            <RefreshCw size={12} className={isFetching ? 'animate-spin' : ''} /> {t('Actualizar')}
          </button>
        )} />

      <BossSwitcher />

      <ReportHero icon={MessageSquareHeart} label={t('Promedio de estrellas')} loading={isLoading || loadingSummary}
        value={avg === '—' ? '—' : `${avg} ★`}
        sub={<span>{t('{n} comentarios en total', { n: total })}</span>}
        cells={[
          [t('Nuevos'), newCount, newCount > 0 ? 'text-amber-200' : ''],
          [t('Total'), total],
          [t('Respondidos'), replied],
          [t('Quieren que les escriban'), wantContact],
        ]} />

      <div className="flex gap-2">
        {tabs.map(([k, label, n]) => (
          <button key={k} type="button" onClick={() => setTab(k)}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition ${
              tab === k ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' : 'border border-gray-100 bg-white text-gray-700 shadow-sm hover:border-blue-200'}`}>
            {label}
            <span className={`rounded-full px-2 py-0.5 text-[11px] ${tab === k ? 'bg-white/20' : 'bg-gray-100 text-gray-500'}`}>{n}</span>
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="flex items-center justify-center gap-2 rounded-2xl border border-gray-100 bg-white py-10 text-sm text-gray-400 shadow-sm">
          <Loader2 size={16} className="animate-spin" /> {t('Cargando...')}
        </div>
      )}
      {isError && !isLoading && (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-6 text-center text-sm text-red-500">
          {t('No se pudo cargar el feedback. Intenta actualizar.')}
        </div>
      )}
      {!isLoading && !isError && list.length === 0 && (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-gray-100 bg-white px-4 py-10 text-center text-sm text-gray-400 shadow-sm">
          <Inbox size={18} />
          {all.length === 0 ? t('Nadie ha escrito todavía.') : t('No hay comentarios nuevos.')}
        </div>
      )}
      {!isLoading && !isError && list.length > 0 && (
        <div className="flex flex-col gap-3">
          {list.map((r) => <Row key={r.id} row={r} onEdit={setEditTarget} />)}
        </div>
      )}

      {editTarget && <EditFeedbackModal row={editTarget} onClose={() => setEditTarget(null)} />}
    </div>
  )
}
