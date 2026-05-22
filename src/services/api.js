import axios from 'axios'
import { toast } from 'sonner'

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
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    const status = error.response?.status
    const data   = error.response?.data

    if (status === 401 && !originalRequest._retry) {
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
        toast.error('Tu sesión expiró. Por favor inicia sesión nuevamente.')
        window.location.href = '/login'
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    // Granular permission denial — show friendly toast, don't redirect
    if (status === 403 && data?.code === 'FORBIDDEN_BY_PERMISSION') {
      toast.error(data.message ?? 'No tienes permiso para realizar esta acción')
      return Promise.reject(error)
    }

    return Promise.reject(error)
  }
)

export default api
