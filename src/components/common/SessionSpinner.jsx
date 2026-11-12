import { useAuth } from '../../context/AuthContext'
import { useT } from '../../i18n'

/**
 * Pantalla de espera mientras se recupera la sesión al abrir la app. Si el API no contesta
 * (lo estamos actualizando, o no hay red) lo dice: la sesión NO se cierra, se reintenta sola.
 */
export default function SessionSpinner({ dark = false }) {
  const t = useT()
  const { isReconnecting } = useAuth()
  return (
    <div className={`flex h-screen flex-col items-center justify-center gap-4 px-6 text-center ${dark ? 'bg-[#111827]' : 'bg-gray-50'}`}>
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      {isReconnecting && (
        <div data-testid="session-reconnecting" role="status">
          <p className={`text-sm font-semibold ${dark ? 'text-white' : 'text-gray-900'}`}>{t('Reconectando…')}</p>
          <p className={`mt-1 max-w-xs text-xs ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
            {t('Estamos actualizando EAZY STOCK o no hay conexión. Tu sesión sigue abierta: entrarás en cuanto vuelva.')}
          </p>
        </div>
      )}
    </div>
  )
}
