import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { AuthProvider } from './context/AuthContext'
import AppRouter from './router/AppRouter'
import { LangProvider } from './i18n'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <LangProvider>
          <AuthProvider>
            <AppRouter />
            <Toaster position="top-right" richColors />
          </AuthProvider>
        </LangProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
