import axios from 'axios'
import { toast } from 'sonner'
import { t } from '../i18n'

const BASE_URL = import.meta.env.VITE_API_URL ?? '/api'

const api = axios.create({ baseURL: BASE_URL })

// --- token refresh state ---
let isRefreshing = false
let pendingRequests = []

const processQueue = (error, token = null) => {
  pendingRequests.forEach(({ resolve, reject }) => error ? reject(error) : resolve(token))
  pendingRequests = []
}

// Attach access token on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('eazystock_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  // Zona horaria del navegador: el BE la usa para que los filtros por día
  // ("las ventas del 15") sean el día de QUIEN MIRA, no el del server europeo.
  config.headers['X-Client-Tz'] = Intl.DateTimeFormat().resolvedOptions().timeZone
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    const status = error.response?.status
    const data   = error.response?.data

    // Never intercept auth/login 401s — wrong credentials should surface to the caller, not trigger a token refresh or redirect
    const isLoginRequest = originalRequest.url?.includes('/auth/login') || originalRequest.url?.includes('/auth/register')
    if (status === 401 && !originalRequest._retry && !isLoginRequest) {
      const refreshToken = localStorage.getItem('eazystock_refresh_token')

      if (!refreshToken) {
        localStorage.removeItem('eazystock_token')
        window.location.href = '/login'
        return Promise.reject(error)
      }

      // Another refresh already in progress — queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingRequests.push({ resolve, reject })
        }).then((newToken) => {
          originalRequest.headers.Authorization = `Bearer ${newToken}`
          return api(originalRequest)
        }).catch((err) => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const res = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken })
        const { accessToken, refreshToken: newRefresh } = res.data

        localStorage.setItem('eazystock_token', accessToken)
        localStorage.setItem('eazystock_refresh_token', newRefresh)

        api.defaults.headers.common.Authorization = `Bearer ${accessToken}`
        originalRequest.headers.Authorization = `Bearer ${accessToken}`

        processQueue(null, accessToken)
        return api(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        localStorage.removeItem('eazystock_token')
        localStorage.removeItem('eazystock_refresh_token')
        toast.error(t('Tu sesión expiró. Por favor inicia sesión nuevamente.'))
        window.location.href = '/login'
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    // Granular permission denial — show friendly toast, don't redirect
    if (status === 403 && data?.code === 'FORBIDDEN_BY_PERMISSION') {
      toast.error(data.message ?? t('No tienes permiso para realizar esta acción'))
      return Promise.reject(error)
    }

    // Planes (M1, 15-oct-2026): el plan no está activo (prueba vencida) → el BE
    // responde 402 a las escrituras; los GET siguen. No se cierra sesión: se
    // manda a Ajustes › Tu plan. Un solo toast aunque fallen varias llamadas.
    if (status === 402 && data?.code === 'PLAN_REQUIRED') {
      toast.error(t('Tu plan no está activo'), {
        id: 'plan-required',
        description: data.message ?? t('Tu prueba terminó: la tienda está en solo lectura hasta que actives un plan.'),
        action: { label: t('Ver mi plan'), onClick: () => { window.location.href = '/settings#plan' } },
        duration: 8000,
      })
      return Promise.reject(error)
    }
    // Límite del plan (p. ej. 5 trabajadores en Basic): la pantalla lo muestra
    // en su sitio; aquí solo el aviso general con el atajo a los planes.
    if (status === 403 && data?.code === 'PLAN_LIMIT') {
      toast.error(data.message ?? t('Llegaste al límite de tu plan'), {
        id: 'plan-limit',
        action: { label: t('Ver planes'), onClick: () => { window.location.href = '/settings#plan' } },
        duration: 8000,
      })
      return Promise.reject(error)
    }

    return Promise.reject(error)
  }
)

export default api
