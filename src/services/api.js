import axios from 'axios'
import { toast } from 'sonner'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
})

// Attach JWT on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('eazystock_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    const data   = error.response?.data

    if (status === 401) {
      localStorage.removeItem('eazystock_token')
      window.location.href = '/login'
      return Promise.reject(error)
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
