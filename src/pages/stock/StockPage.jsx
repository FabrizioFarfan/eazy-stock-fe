import { useState } from 'react'
import { PackagePlus, SlidersHorizontal, ArrowUpDown } from 'lucide-react'
import PageTitle from '../../components/common/PageTitle'
import HelpDrawer from '../../components/common/HelpDrawer'
import { useAuth } from '../../context/AuthContext'
import { useT } from '../../i18n'
import MovementModal from './MovementModal'
import SupplierReceiptModal from '../../components/stock/SupplierReceiptModal'
import InventoryTab from '../../components/stock/InventoryTab'
import ReceiptsTab from '../../components/stock/ReceiptsTab'
import MovementsTab from '../../components/stock/MovementsTab'

const TABS = [
  { id: 'movements',  label: 'Movimientos' },
  { id: 'inventory',  label: 'Inventario' },
  { id: 'receipts',   label: 'Recepciones' },
]

export default function StockPage() {
  const t = useT()
  const { user }  = useAuth()
  const isManager = user?.role === 'OWNER' || user?.role === 'SUPER_ADMIN'

  const [activeTab, setActiveTab]       = useState('movements')
  const [modal, setModal]               = useState(null) // null | 'ADJUSTMENT'
  const [showReceiptModal, setShowReceiptModal] = useState(false)

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <PageTitle icon={ArrowUpDown} tone="amber">{t('Stock')}</PageTitle>
          <HelpDrawer title={t('Cómo usar la página Stock')} autoOpenKey="eazystock_stock_help_v2">
            <p>
              {t('Esta página tiene 3 pestañas, cada una responde una pregunta distinta:')}
            </p>
            <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
              <p className="font-semibold text-gray-800">📋 {t('Movimientos')}</p>
              <p className="mt-1">
                {t('El historial completo de todo lo que entró y salió del almacén: ventas, entradas de mercadería, ajustes y devoluciones. Responde "¿qué pasó con mi stock y cuándo?". Si un número no te cuadra, acá está la trazabilidad.')}
              </p>
              <p className="mt-1">
                {t('Cada movimiento lleva su tipo (Entrada, Ajuste, Venta o Devolución) y, entre paréntesis, el stock que quedó del producto justo después. Filtra por Ventas para ver el Resumen de reposición: cuánto vendiste de cada producto, listo para armar tu pedido.')}
              </p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
              <p className="font-semibold text-gray-800">📦 {t('Inventario')}</p>
              <p className="mt-1">
                {t('La foto actual de tus productos: cuánto stock queda de cada uno, su mínimo y su último costo. Responde "¿cuánto tengo hoy?". Haz click en cualquier fila para ver el detalle del producto y desde ahí registrar una entrada o ajustar el stock directamente.')}
              </p>
              <p className="mt-1">
                {t('Debajo de cada nombre ves la unidad de venta (unidad, paquete, kilo, gramo, metro…). La columna Vence muestra el badge de vencimiento y permite filtrar Por vencer (30 días), Vencidos o Con fecha.')}
              </p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
              <p className="font-semibold text-gray-800">🔽 {t('Filtros por columna')}</p>
              <p className="mt-1">
                {t('Cada cabecera del Inventario tiene un embudo estilo Excel: escribe un texto, elige un proveedor o marca, o define un rango de stock o costo. Los filtros activos aparecen como chips arriba de la tabla; quítalos de a uno o con "Limpiar todo".')}
              </p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
              <p className="font-semibold text-gray-800">🚚 {t('Recepciones')}</p>
              <p className="mt-1">
                {t('Las compras de mercadería a tus proveedores. Cada recepción registra qué productos llegaron, a qué costo y cómo se pagó: al contado (no genera deuda) o a crédito (se suma a la cuenta por pagar del proveedor — la ves en Cuentas). Responde "¿qué me llegó y qué le debo a cada proveedor?".')}
              </p>
              <p className="mt-1">
                {t('Puedes buscar por número de factura/guía y filtrar por modalidad. Las fechas se interpretan en tu zona horaria: si filtras "hoy" verás las recepciones de tu día, no del servidor.')}
              </p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
              <p className="font-semibold text-gray-800">📌 {t('Cabecera fija')}</p>
              <p className="mt-1">
                {t('En todas las tablas la fila de títulos queda fija al hacer scroll, así nunca pierdes de vista qué columna estás leyendo.')}
              </p>
            </div>
            <p className="text-xs text-gray-400">
              {t('Tip: "Registrar recepción" es la forma correcta de ingresar mercadería comprada (actualiza stock, costo y deuda de una vez). "Ajuste" es solo para corregir diferencias del inventario físico.')}
            </p>
          </HelpDrawer>
        </div>
        {isManager && (
          <div className="flex gap-2">
            <button onClick={() => setShowReceiptModal(true)}
              className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-emerald-500/30 hover:bg-emerald-600 transition-all active:scale-[0.98]">
              <PackagePlus size={15} />
              {t('Registrar recepción')}
            </button>
            <button onClick={() => setModal('ADJUSTMENT')}
              className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
              <SlidersHorizontal size={15} />
              {t('Ajuste')}
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-gray-200 bg-gray-100 p-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t(tab.label)}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'inventory' && <InventoryTab />}
      {activeTab === 'receipts'  && <ReceiptsTab />}
      {activeTab === 'movements' && <MovementsTab />}

      {modal && <MovementModal type={modal} onClose={() => setModal(null)} />}
      {showReceiptModal && <SupplierReceiptModal onClose={() => setShowReceiptModal(false)} />}
    </div>
  )
}
