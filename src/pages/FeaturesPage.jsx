import { Link } from 'react-router-dom'
import { ArrowRight, ScanLine, Wallet, Truck, Boxes, CreditCard, FileSpreadsheet, LayoutGrid } from 'lucide-react'
import { useT } from '../i18n'
import { Navbar, Footer, CtaBanner, ProductShowcases, CatalogBento, FiadoSection, ImportSection, Features } from './LandingPage'
import { PageHero, SectionTabs, usePublicPage } from './landing/site'

const CTA = '/login'

/** /funciones — qué hace Eazy Stock, con las maquetas y la lista completa por áreas. */
export default function FeaturesPage() {
  const t = useT()
  usePublicPage({
    title: t('Funciones — Eazy Stock'),
    description: t('Todo lo que hace Eazy Stock: venta con escáner, cierre de caja por medio de pago, pedido al proveedor en PDF, fiado con recordatorio por WhatsApp, importación desde Excel, vencimientos, permisos por empleado y reportes.'),
    path: '/funciones',
  })
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Navbar />
      <PageHero
        kicker={t('Funciones')}
        title={t('Todo lo que pasa en tu tienda,')}
        highlight={t('en una sola app.')}
        sub={t('Vender, cobrar, cerrar la caja, pedir al proveedor y fiar con control. Cada función nació de un problema real de un negocio real.')}
      >
        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link to={CTA} className="group inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-[#0a0e1a] hover:bg-blue-50">
            {t('Probar gratis')} <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
          </Link>
          <a href="#funciones" className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-slate-200 hover:bg-white/10">
            {t('Ver la lista completa')}
          </a>
        </div>
      </PageHero>
      <SectionTabs items={[
        { href: '#vender',    label: 'Vender',     icon: ScanLine },
        { href: '#caja',      label: 'Caja',       icon: Wallet },
        { href: '#pedidos',   label: 'Pedidos',    icon: Truck },
        { href: '#catalogo',  label: 'Catálogo',   icon: Boxes },
        { href: '#fiado',     label: 'Fiado',      icon: CreditCard },
        { href: '#importar',  label: 'Importar',   icon: FileSpreadsheet },
        { href: '#funciones', label: 'Todas',      icon: LayoutGrid },
      ]} />
      <ProductShowcases />
      <div id="catalogo" className="scroll-mt-28"><CatalogBento /></div>
      <FiadoSection />
      <ImportSection />
      <Features />
      <CtaBanner />
      <Footer />
    </div>
  )
}
