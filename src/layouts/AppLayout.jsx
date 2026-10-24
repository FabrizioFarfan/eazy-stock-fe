import { formatPrice } from '../utils/formatMoney'
import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ShoppingCart, Package } from 'lucide-react'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import PageWatermark from '../components/common/PageWatermark'
import TutorialModal from '../components/tutorial/TutorialModal'
import SubscriptionBanner from '../components/subscription/SubscriptionBanner'
import EmailVerifyBanner from '../components/common/EmailVerifyBanner'
import { useAuth } from '../context/AuthContext'
import { useBusinessSocket } from '../hooks/useBusinessSocket'
import { useT } from '../i18n'
import { readSetupPending } from '../utils/setupPendingNotice'

function formatCurrency(v) {
  return formatPrice(v ?? 0) // moneda del negocio
}

export default function AppLayout({ children }) {
  const { user, seenTutorials, markTutorialSeen } = useAuth()
  const queryClient = useQueryClient()
  const t = useT()
  const [sidebarOpen,    setSidebarOpen]    = useState(false)
  const [showTutorial,   setShowTutorial]   = useState(false)

  // Both OWNER and EMPLOYEE subscribe to real-time business events
  useBusinessSocket(
    (user?.role === 'OWNER' || user?.role === 'EMPLOYEE') ? user?.businessId : null,
    (event) => {
      if (event.type === 'NEW_SALE') {
        const sale  = event.payload
        const items = sale.items?.length ?? 0

        if (user?.role === 'OWNER') {
          toast.success(`${t('Nueva venta')} · ${formatCurrency(sale.total)}`, {
            description: `${sale.employeeName} · ${t('{n} producto(s)', { n: items })}`,
            icon: <ShoppingCart size={16} />,
            duration: 6000,
          })
          queryClient.invalidateQueries({ queryKey: ['sales'] })
          queryClient.invalidateQueries({ queryKey: ['products'] })
          queryClient.invalidateQueries({ queryKey: ['reports', 'daily-summary'] })
          queryClient.invalidateQueries({ queryKey: ['reports', 'sales'] })
        } else if (user?.role === 'EMPLOYEE' && sale.employeeId === user?.id) {
          toast.success(`${t('Venta registrada')} · ${formatCurrency(sale.total)}`, {
            description: `${t('{n} producto(s)', { n: items })} · ${t('procesado correctamente')}`,
            icon: <ShoppingCart size={16} />,
            duration: 4000,
          })
          queryClient.invalidateQueries({ queryKey: ['sales'] })
          queryClient.invalidateQueries({ queryKey: ['products'] })
        }
      }

      if (event.type === 'STOCK_UPDATE') {
        const mov = event.payload
        if (user?.role === 'EMPLOYEE') {
          toast.info(t('Nuevo stock disponible'), {
            description: `${mov.productName} · ${t('{n} unidades ahora disponibles', { n: mov.stockAfter })}`,
            icon: <Package size={16} />,
            duration: 5000,
          })
        }
        queryClient.invalidateQueries({ queryKey: ['products'] })
        queryClient.invalidateQueries({ queryKey: ['stock-movements'] })
      }

      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  )

  // El "visto" del tutorial de bienvenida se persiste por usuario en el BE
  const WELCOME_TUTORIAL_KEY = 'eazystock_tutorial_seen'

  // Show on first visit (cuando el set de vistos ya cargó del BE)
  // En /bienvenida («Carga tu catálogo», 20-oct-2026) no se abre encima: esa página
  // ya es el primer paso; el tour salta al entrar al panel.
  const { pathname } = useLocation()
  useEffect(() => {
    if (!seenTutorials || seenTutorials.has(WELCOME_TUTORIAL_KEY)) return
    if (pathname === '/bienvenida') return
    // Registro con un documento que ya usó su prueba (setupPending): va directo a Tu plan,
    // sin el tour encima. Sale cuando el plan deja de estar en solo lectura (se borra el aviso).
    if (readSetupPending(user?.businessId)) return
    setShowTutorial(true)
  }, [seenTutorials, pathname, user?.businessId])

  // Listen for manual trigger from SettingsPage
  useEffect(() => {
    const handler = () => setShowTutorial(true)
    window.addEventListener('eazystock:show-tutorial', handler)
    return () => window.removeEventListener('eazystock:show-tutorial', handler)
  }, [])

  const closeTutorial = () => {
    markTutorialSeen(WELCOME_TUTORIAL_KEY)
    setShowTutorial(false)
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <SubscriptionBanner />
        <EmailVerifyBanner />
        <main className="flex-1 overflow-auto bg-gray-50 p-4 md:p-6">
          {children}
        </main>
      </div>
      <PageWatermark />
      {showTutorial && <TutorialModal onClose={closeTutorial} />}
    </div>
  )
}
