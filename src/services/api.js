import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
})

// Attach JWT on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('eazystock_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Global 401 handler — clear token and redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('eazystock_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
