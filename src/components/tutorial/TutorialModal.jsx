import { useState } from 'react'
import {
  Package, ShoppingCart, ArrowUpDown, BarChart2, Sparkles, ChevronRight, ChevronLeft, X,
  CalendarClock, Scale, HandCoins, FileText, ClipboardList, Smartphone,
} from 'lucide-react'
import { useT } from '../../i18n'

const STEPS = [
  {
    icon: Sparkles,
    color: 'bg-blue-600',
    title: '¡Bienvenido a Eazy Stock!',
    desc: 'Todo lo que necesitas para gestionar el inventario y ventas de tu negocio en un solo lugar, fácil y rápido.',
  },
  {
    icon: Package,
    color: 'bg-blue-500',
    title: 'Gestiona tus productos',
    desc: 'Agrega productos con precio de compra, venta y stock mínimo. Asígnales proveedor y marca para organizar mejor tu catálogo.',
  },
  {
    icon: ShoppingCart,
    color: 'bg-green-500',
    title: 'Registra ventas rápido',
    desc: 'Desde "Nueva Venta" busca productos por nombre, SKU o código QR, aplica descuentos y completa la venta en segundos.',
  },
  {
    icon: ArrowUpDown,
    color: 'bg-purple-500',
    title: 'Controla tu stock',
    desc: 'Recibe mercadería, ajusta el stock manualmente y recibe alertas automáticas cuando un producto baja del mínimo.',
  },
  {
    icon: BarChart2,
    color: 'bg-rose-500',
    title: 'Analiza tu negocio',
    desc: 'En Reportes ve las ventas por día, los productos más vendidos y filtra por proveedor, marca o empleado.',
  },
  {
    icon: CalendarClock,
    color: 'bg-amber-500',
    title: 'Productos por vencer',
    desc: 'Ponle fecha de vencimiento a tus productos: verás un badge en la tabla y el reporte «Por vencer» te avisa de lo que caduca en los próximos 30 días.',
  },
  {
    icon: Scale,
    color: 'bg-teal-500',
    title: 'Cierre de caja por medio de pago',
    desc: 'En Balance cuadra el día por efectivo, Yape, Plin o tarjeta. Tus vendedores pueden ver solo el cierre de caja, sin ganancias ni costos.',
  },
  {
    icon: HandCoins,
    color: 'bg-orange-500',
    title: 'Fiado y cuentas por cobrar',
    desc: 'Vende al fiado, registra abonos y sigue cada deuda en Cuentas x cobrar. Envía un recordatorio de pago por WhatsApp con un toque.',
  },
  {
    icon: FileText,
    color: 'bg-indigo-500',
    title: 'Pedido al proveedor en PDF',
    desc: 'Desde Reportes › Stock bajo genera el pedido de reposición por proveedor, edita cantidades en la previsualización y descárgalo en PDF.',
  },
  {
    icon: ClipboardList,
    color: 'bg-cyan-500',
    title: 'Cotizaciones',
    desc: 'Arma una cotización con los mismos productos de tu catálogo, compártela con el cliente y conviértela en venta cuando la apruebe.',
  },
  {
    icon: Smartphone,
    color: 'bg-slate-700',
    title: 'Instálala como app',
    desc: 'Desde Ajustes instala Eazy Stock en tu celular o PC, activa el modo oscuro y elige el idioma: español, inglés o italiano.',
  },
]

export default function TutorialModal({ onClose }) {
  const t = useT()
  const [step, setStep] = useState(0)
  const current = STEPS[step]
  const Icon = current.icon
  const isLast = step === STEPS.length - 1

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl overflow-hidden">

        {/* Close */}
        <div className="flex justify-end px-4 pt-4">
          <button
            onClick={onClose}
            aria-label={t('Cerrar')}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col items-center px-8 pb-6 pt-2 text-center">
          {/* Icon */}
          <div className={`mb-5 flex h-16 w-16 items-center justify-center rounded-2xl ${current.color}`}>
            <Icon size={32} className="text-white" />
          </div>

          {/* Text */}
          <h2 className="mb-2 text-xl font-bold text-gray-900">{t(current.title)}</h2>
          <p className="text-sm leading-relaxed text-gray-500">{t(current.desc)}</p>
        </div>

        {/* Step dots */}
        <div className="flex justify-center gap-1.5 pb-4">
          {STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              aria-label={t('Paso {n}', { n: i + 1 })}
              className={`h-1.5 rounded-full transition-all ${
                i === step ? 'w-6 bg-blue-600' : 'w-1.5 bg-gray-300'
              }`}
            />
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3">
          <button
            onClick={() => step > 0 ? setStep(step - 1) : onClose()}
            className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm text-gray-500 hover:bg-gray-100"
          >
            {step > 0 && <ChevronLeft size={14} />}
            {step === 0 ? t('Omitir') : t('Atrás')}
          </button>

          <button
            onClick={() => isLast ? onClose() : setStep(step + 1)}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            {isLast ? t('¡Empezar!') : t('Siguiente')}
            {!isLast && <ChevronRight size={14} />}
          </button>
        </div>
      </div>
    </div>
  )
}
