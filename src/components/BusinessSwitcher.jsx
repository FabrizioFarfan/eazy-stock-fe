import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, Check, Plus, Store, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../context/AuthContext'
import { useMyBusinesses } from '../hooks/useMyBusinesses'
import { FlagAvatar } from './boss/BossKit'
import { getErrorMessage } from '../utils/handleApiError'
import { useT } from '../i18n'

/**
 * Cambiador de negocio en la Topbar (M1 «Varios negocios por dueño», 15-oct-2026).
 * Con un solo negocio es solo el nombre, como antes; con varios, un botón con
 * chevron que lista los negocios de la cuenta y «+ Nuevo negocio» → /negocios.
 * Al elegir uno se reemiten los tokens (el JWT lleva el businessId) y la app
 * arranca en el dashboard del negocio elegido, sin cerrar sesión.
 */
export default function BusinessSwitcher() {
  const t = useT()
  const { user, switchBusiness } = useAuth()
  const isOwner = user?.role === 'OWNER'
  const { data } = useMyBusinesses({ enabled: isOwner })
  const [open, setOpen] = useState(false)
  const [switching, setSwitching] = useState(null)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey) }
  }, [open])

  if (!user?.businessName) return null
  const list = Array.isArray(data) ? data.filter((b) => b.active !== false) : []
  const several = isOwner && list.length > 1

  if (!several) {
    return <span className="hidden text-sm font-medium text-gray-400 sm:block">{user.businessName}</span>
  }

  const pick = async (b) => {
    if (b.current || b.id === user.businessId) { setOpen(false); return }
    setSwitching(b.id)
    try {
      await switchBusiness(b.id)
      toast.success(t('Ahora estás en {name}', { name: b.name }))
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setSwitching(null)
      setOpen(false)
    }
  }

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-haspopup="menu" aria-expanded={open}
        className="flex max-w-[11rem] items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 sm:max-w-[16rem]">
        <Store size={14} className="flex-shrink-0 text-blue-600" />
        <span className="truncate">{user.businessName}</span>
        <ChevronDown size={14} className={`flex-shrink-0 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 z-40 mt-2 w-72 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl">
          <p className="px-4 pb-1 pt-3 text-[11px] font-bold uppercase tracking-widest text-gray-400">{t('Tus negocios')}</p>
          <ul className="max-h-72 overflow-auto py-1">
            {list.map((b) => {
              const isCurrent = b.current || b.id === user.businessId
              return (
                <li key={b.id}>
                  <button type="button" role="menuitem" onClick={() => pick(b)} disabled={!!switching}
                    className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors hover:bg-gray-50 disabled:opacity-60 ${isCurrent ? 'bg-blue-50/60' : ''}`}>
                    <FlagAvatar code={b.countryCode} className="!h-8 !w-8" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold text-gray-900">{b.name}</span>
                      <span className="block text-xs text-gray-400">{b.currency}{b.employeesActive != null ? ` · ${t('{n} trabajadores', { n: b.employeesActive })}` : ''}</span>
                    </span>
                    {switching === b.id ? <Loader2 size={15} className="animate-spin text-blue-600" /> : isCurrent ? <Check size={15} className="text-blue-600" /> : null}
                  </button>
                </li>
              )
            })}
          </ul>
          <div className="border-t border-gray-100 p-2">
            <Link to="/negocios" onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-blue-600 transition-colors hover:bg-blue-50">
              <Plus size={15} /> {t('Nuevo negocio')} <span className="ml-auto text-xs font-medium text-gray-400">{t('Mis negocios')}</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
