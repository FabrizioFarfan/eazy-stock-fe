import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { MessageSquareHeart, Send, Loader2, MessageCircle } from 'lucide-react'
import { toast } from 'sonner'
import { feedbackApi } from '../../services/endpoints/feedback'
import { getErrorMessage } from '../../utils/handleApiError'
import { useAuth } from '../../context/AuthContext'
import { useT } from '../../i18n'
import { Chip } from '../boss/BossKit'
import { Stars } from './FeedbackKit'
import { TOPICS, TOPIC_LABEL, STATUS_LABEL, STATUS_TONE, formatWhen } from './feedbackUtils'

export const MY_FEEDBACK_KEY = 'my-feedback'
const unwrap = (r) => r.data?.data ?? r.data
const MAX = 2000

/**
 * Ajustes › Tu opinión (Frank, 16-oct-2026): la ve CUALQUIER rol (dueño y vendedores).
 * Estrellas + tema + mensaje + «pueden escribirme por WhatsApp»; abajo, lo que ya
 * contó con su estado y la respuesta de Frank cuando la hay. Se llega con
 * /settings#feedback. Mismo chrome que las demás secciones de Ajustes.
 */
export default function FeedbackSection() {
  const t = useT()
  const { user } = useAuth()
  const qc = useQueryClient()
  const ref = useRef(null)
  const { hash } = useLocation()
  const [rating, setRating] = useState(0)
  const [topic, setTopic] = useState(null)
  const [message, setMessage] = useState('')
  const [wantsContact, setWantsContact] = useState(false)

  const { data: list = [], isLoading, isError } = useQuery({
    queryKey: [MY_FEEDBACK_KEY, user?.id],
    queryFn: () => feedbackApi.getMyFeedback().then(unwrap),
    enabled: !!user,
  })

  const send = useMutation({
    mutationFn: (data) => feedbackApi.sendFeedback(data).then(unwrap),
    onSuccess: () => {
      toast.success(t('¡Gracias! Lo leemos todo.'))
      setRating(0); setTopic(null); setMessage(''); setWantsContact(false)
      qc.invalidateQueries({ queryKey: [MY_FEEDBACK_KEY] })
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  useEffect(() => {
    if (hash === '#feedback' && ref.current) {
      const timer = setTimeout(() => ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150)
      return () => clearTimeout(timer)
    }
  }, [hash])

  const onSubmit = (e) => {
    e.preventDefault()
    const msg = message.trim()
    if (!msg) { toast.error(t('Cuéntanos algo, aunque sea corto')); return }
    send.mutate({ rating: rating || null, topic, message: msg, wantsContact })
  }

  return (
    <div id="feedback" ref={ref} className="scroll-mt-24 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-5 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><MessageSquareHeart size={17} /></span>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-gray-900">{t('Tu opinión')}</h3>
            <p className="truncate text-xs text-gray-400">{t('Lo lee Frank en persona')}</p>
          </div>
        </div>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-4 px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold text-gray-800">{t('¿Cómo te va con Eazy Stock?')}</p>
          <Stars value={rating} onChange={setRating} size={24} label={t('{n} de 5 estrellas', { n: rating })} />
        </div>

        <div className="flex flex-wrap gap-2">
          {TOPICS.map((k) => {
            const on = topic === k
            return (
              <button key={k} type="button" onClick={() => setTopic(on ? null : k)} aria-pressed={on}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  on ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30' : 'border border-gray-200 bg-white text-gray-600 hover:border-blue-200 hover:text-blue-700'}`}>
                {t(TOPIC_LABEL[k])}
              </button>
            )
          })}
        </div>

        <div>
          <textarea rows={4} value={message} maxLength={MAX} onChange={(e) => setMessage(e.target.value)}
            placeholder={t('¿Qué te haría la vida más fácil en la tienda? ¿Qué te molesta?')}
            className="w-full resize-y rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 outline-none transition placeholder-gray-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20" />
          <p className="mt-1 text-right text-[11px] text-gray-400">{message.length}/{MAX}</p>
        </div>

        <label className="flex items-center gap-3 rounded-xl bg-gray-50 px-3.5 py-3 text-sm text-gray-700">
          <input type="checkbox" checked={wantsContact} onChange={(e) => setWantsContact(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600" />
          <MessageCircle size={14} className="flex-shrink-0 text-emerald-600" />
          {t('Pueden escribirme por WhatsApp sobre esto')}
        </label>

        <div className="flex justify-end">
          <button type="submit" disabled={send.isPending || !message.trim()}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-blue-600/30 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
            {send.isPending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
            {send.isPending ? t('Enviando...') : t('Enviar')}
          </button>
        </div>
      </form>

      <div className="border-t border-gray-100 px-5 py-4">
        <p className="mb-3 text-xs font-bold uppercase tracking-wide text-gray-400">{t('Lo que ya nos contaste')}</p>
        {isLoading && (
          <p className="flex items-center gap-2 py-3 text-sm text-gray-400"><Loader2 size={14} className="animate-spin" /> {t('Cargando...')}</p>
        )}
        {isError && !isLoading && (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 ring-1 ring-red-100">{t('No se pudieron cargar tus comentarios.')}</p>
        )}
        {!isLoading && !isError && list.length === 0 && (
          <p className="py-3 text-sm text-gray-400">{t('Aún no nos has contado nada. Lo primero que escribas lo leemos hoy.')}</p>
        )}
        {!isLoading && !isError && list.length > 0 && (
          <ul className="flex flex-col gap-3">
            {list.map((f) => (
              <li key={f.id} className="rounded-2xl border border-gray-100 bg-gray-50/70 p-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-gray-500">{formatWhen(f.createdAt)}</span>
                    {f.topic && <Chip tone="gray">{t(TOPIC_LABEL[f.topic] ?? f.topic)}</Chip>}
                    <Chip tone={STATUS_TONE[f.status] ?? 'gray'}>{t(STATUS_LABEL[f.status] ?? f.status)}</Chip>
                  </div>
                  {f.rating > 0 && <Stars value={f.rating} size={14} />}
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm text-gray-800">{f.message}</p>
                {f.bossReply && (
                  <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50 px-3.5 py-3">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-blue-700">
                      {t('Respuesta de Frank')}{f.repliedAt ? <span className="ml-1.5 font-medium normal-case tracking-normal text-blue-500">· {formatWhen(f.repliedAt)}</span> : null}
                    </p>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-blue-900">{f.bossReply}</p>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
