import {
  Package, ShoppingCart, ArrowUpDown, BarChart2, Sparkles, CalendarClock, Scale, HandCoins,
  FileText, ClipboardList, Smartphone, Bell, Users, Shield, Search, CreditCard, Check,
  UserPlus, Send, Wallet, Truck, FileSpreadsheet, Coins, Phone, Globe, Moon, AlertTriangle, Receipt,
} from 'lucide-react'

/**
 * Guías de Ajustes › Ayuda (Frank, 2-sep-2026: «actualiza los tutoriales y
 * agrega más si crees que vale la pena»). Cada guía es una lista de pasos que
 * TutorialModal pinta igual que el tutorial de bienvenida. Español como llave;
 * las traducciones viven en i18n/dict/guides.js.
 */
export const WELCOME_STEPS = [
  { icon: Sparkles,      color: 'bg-blue-600',   title: '¡Bienvenido a Eazy Stock!', desc: 'Todo lo que necesitas para gestionar el inventario, las ventas y el fiado de tu negocio en un solo lugar, fácil y rápido.' },
  { icon: Package,       color: 'bg-blue-500',   title: 'Gestiona tus productos', desc: 'Agrega productos con precio de compra, venta y stock mínimo, o importa tu lista desde Excel. Asígnales proveedor, marca y categoría para organizar el catálogo.' },
  { icon: ShoppingCart,  color: 'bg-green-500',  title: 'Registra ventas rápido', desc: 'Desde «Nueva venta» busca productos por nombre, SKU o escanea el código, aplica descuentos, elige cómo pagó el cliente y confirma en segundos.' },
  { icon: HandCoins,     color: 'bg-orange-500', title: 'Fiado y cuentas por cobrar', desc: 'Activa «Vender al fiado», elige al cliente de la lista (o regístralo ahí mismo) y la deuda se anota sola. Cobra abonos y manda recordatorios por WhatsApp desde Cuentas x cobrar.' },
  { icon: ArrowUpDown,   color: 'bg-purple-500', title: 'Controla tu stock', desc: 'Recibe mercadería del proveedor, ajusta el stock a mano cuando haga falta y recibe alertas cuando un producto baja del mínimo.' },
  { icon: CalendarClock, color: 'bg-amber-500',  title: 'Productos por vencer', desc: 'Ponle fecha de vencimiento a tus productos: verás un aviso en la tabla y el reporte «Por vencer» te muestra lo que caduca en los próximos 30 días.' },
  { icon: Scale,         color: 'bg-teal-500',   title: 'Cierre de caja por medio de pago', desc: 'En Balance cuadra el día por efectivo, billetera digital o tarjeta. Tus vendedores pueden ver solo el cierre de caja, sin ganancias ni costos.' },
  { icon: BarChart2,     color: 'bg-rose-500',   title: 'Analiza tu negocio', desc: 'En Reportes ve las ventas por día, los productos más vendidos, el rendimiento de cada vendedor y filtra por proveedor, marca o empleado.' },
  { icon: ClipboardList, color: 'bg-cyan-500',   title: 'Cotizaciones', desc: 'Arma una cotización con tu catálogo, descárgala en PDF o envíala por WhatsApp y correo, y conviértela en venta cuando el cliente la apruebe.' },
  { icon: FileText,      color: 'bg-indigo-500', title: 'Pedido al proveedor en PDF', desc: 'Desde Reportes › Stock bajo genera el pedido de reposición por proveedor, edita cantidades y descárgalo en PDF para enviarlo.' },
  { icon: Bell,          color: 'bg-pink-500',   title: 'Notificaciones', desc: 'La campana avisa de ventas, devoluciones y cambios de stock mientras no mirabas. En Notificaciones está el historial completo, agrupado por día.' },
  { icon: Shield,        color: 'bg-slate-600',  title: 'Empleados con permisos', desc: 'Crea a tus vendedores y decide uno por uno qué pueden hacer: vender, fiar, aplicar descuentos, ver reportes… Lo que no les actives, no lo ven.' },
  { icon: Smartphone,    color: 'bg-slate-700',  title: 'Instálala como app', desc: 'Desde Ajustes instala Eazy Stock en tu celular o PC, activa el modo oscuro, elige el idioma y fija la moneda con la que trabaja tu negocio.' },
]

export const GUIDES = {
  venta: {
    title: 'Cómo registrar una venta',
    subtitle: 'Buscar, cobrar y confirmar en segundos',
    icon: ShoppingCart, color: 'bg-green-50', iconColor: 'text-green-600',
    steps: [
      { icon: Search,       color: 'bg-green-500',  title: 'Busca el producto', desc: 'En «Nueva venta» escribe el nombre o el SKU, o toca «Cámara» para escanear el código de barras. Con un lector USB basta con disparar sobre el código.' },
      { icon: ShoppingCart, color: 'bg-green-600',  title: 'Arma el carrito', desc: 'Toca «Agregar» y ajusta la cantidad. Los productos por peso o metro aceptan decimales; los de precio variable te piden el precio al agregarlos.' },
      { icon: CreditCard,   color: 'bg-blue-500',   title: 'Elige cómo pagó', desc: 'Efectivo, billetera digital, tarjeta u otro medio: queda registrado para el cierre de caja. Si tienes permiso, aplica un descuento en monto o porcentaje.' },
      { icon: Check,        color: 'bg-emerald-600', title: 'Confirma', desc: 'Revisa el total y confirma. El stock se descuenta al instante y la venta aparece en Ventas, en el Dashboard y en los reportes.' },
      { icon: AlertTriangle, color: 'bg-amber-500', title: 'Si te equivocaste', desc: 'Desde Ventas puedes cancelar una venta (con permiso): el stock vuelve y, si era al fiado, la deuda del cliente se corrige sola.' },
    ],
  },
  fiado: {
    title: 'Cómo vender al fiado',
    subtitle: 'Cliente, límite de crédito y cobros',
    icon: HandCoins, color: 'bg-orange-50', iconColor: 'text-orange-600',
    steps: [
      { icon: Shield,    color: 'bg-slate-600',   title: 'Primero, el permiso', desc: 'Solo fía quien tiene activado «Vender al fiado». El dueño lo da en Empleados › Permisos, empleado por empleado. En el celular los botones están en la tarjeta de cada empleado.' },
      { icon: HandCoins, color: 'bg-orange-500',  title: 'Activa «Vender al fiado»', desc: 'En la venta, con productos en el carrito, enciende el interruptor y toca «Elegir cliente»: verás la lista completa de tus clientes, con su deuda y su límite.' },
      { icon: Search,    color: 'bg-blue-500',    title: 'Encuéntralo antes de crearlo', desc: 'Busca por nombre, documento o teléfono y usa los filtros «Con deuda» o «Con crédito». Si registras uno nuevo y ya existe alguien parecido, la app te lo muestra: elige «Usar este» y evitas un cliente duplicado.' },
      { icon: Wallet,    color: 'bg-purple-500',  title: 'El límite de crédito', desc: 'Cada cliente tiene un límite. Con 0 no puede operar al fiado. Antes de confirmar ves su deuda actual, el límite y cómo queda después de esta venta.' },
      { icon: Receipt,   color: 'bg-emerald-600', title: 'Cobra y recuerda', desc: 'En Cuentas x cobrar registras abonos, descargas el estado de cuenta en PDF y mandas un recordatorio por WhatsApp con un toque.' },
    ],
  },
  cotizacion: {
    title: 'Cómo hacer una cotización',
    subtitle: 'PDF, WhatsApp y pase a venta',
    icon: ClipboardList, color: 'bg-cyan-50', iconColor: 'text-cyan-600',
    steps: [
      { icon: ClipboardList, color: 'bg-cyan-500',   title: 'Arma la cotización', desc: 'En Cotización busca productos del catálogo igual que en una venta. No descuenta stock ni registra ninguna venta: es solo un presupuesto.' },
      { icon: UserPlus,      color: 'bg-blue-500',   title: 'Ponle cliente', desc: 'Elige uno de tus clientes, registra uno nuevo o escribe solo nombre, teléfono y correo. El PDF sale con sus datos.' },
      { icon: Send,          color: 'bg-emerald-600', title: 'Envíala', desc: 'Descárgala en PDF, imprímela o envíala por WhatsApp o correo. En el celular el PDF va adjunto de una; en la PC se descarga y se abre el chat con el mensaje listo.' },
      { icon: FileText,      color: 'bg-indigo-500', title: 'Historial', desc: 'Todas quedan en Cotizaciones › Historial con su número. Puedes editar las abiertas, duplicar una vieja con los precios de hoy y ver las de cada cliente en su ficha.' },
      { icon: ShoppingCart,  color: 'bg-green-600',  title: 'Conviértela en venta', desc: 'Cuando el cliente acepte, toca «Vender estos productos»: el carrito se llena solo y la cotización queda marcada como vendida.' },
    ],
  },
  stock: {
    title: 'Cómo controlar el stock',
    subtitle: 'Recepciones, ajustes y alertas',
    icon: ArrowUpDown, color: 'bg-purple-50', iconColor: 'text-purple-600',
    steps: [
      { icon: Truck,        color: 'bg-purple-500', title: 'Recibe mercadería', desc: 'En Stock › Recepciones registra lo que llegó del proveedor con su costo. El stock sube y, si fue a crédito, la deuda queda en Cuentas x pagar.' },
      { icon: ArrowUpDown,  color: 'bg-violet-600', title: 'Ajusta a mano', desc: 'Merma, rotura o conteo: en Stock › Ajustes sumas o restas unidades con un motivo. Todo queda en el historial de movimientos.' },
      { icon: AlertTriangle, color: 'bg-amber-500', title: 'Stock mínimo', desc: 'Fija un mínimo por producto. Cuando baja, aparece en «Alertas de stock bajo» del Dashboard y en el reporte para armar el pedido al proveedor.' },
      { icon: CalendarClock, color: 'bg-rose-500',  title: 'Vencimientos', desc: 'Con fecha de vencimiento, el reporte «Por vencer» te muestra lo que caduca en 30 días para venderlo o devolverlo a tiempo.' },
      { icon: FileSpreadsheet, color: 'bg-emerald-600', title: 'Importa y exporta', desc: 'Desde Productos importa tu lista desde Excel (con vista previa y detección de duplicados) y exporta el inventario cuando quieras.' },
    ],
  },
  empleados: {
    title: 'Empleados y permisos',
    subtitle: 'Qué puede hacer cada vendedor',
    icon: Users, color: 'bg-blue-50', iconColor: 'text-blue-600',
    steps: [
      { icon: UserPlus, color: 'bg-blue-500',    title: 'Crea al empleado', desc: 'En Empleados › «Nuevo empleado» le pones nombre, correo y contraseña. Entra con su correo y ve solo lo que le permitas.' },
      { icon: Shield,   color: 'bg-orange-500',  title: 'Dale permisos', desc: 'Toca «Permisos» en su fila (o en su tarjeta, en el celular). Los cambios se aplican al instante: registrar ventas, vender al fiado, aplicar descuentos, editar precios, ver reportes, gestionar clientes…' },
      { icon: HandCoins, color: 'bg-amber-600',  title: 'Fiado bajo control', desc: 'Si no quieres que un vendedor fíe, deja apagado «Vender al fiado»: no verá la opción en la venta. Puedes activarlo cuando confíes.' },
      { icon: BarChart2, color: 'bg-rose-500',   title: 'Mide su rendimiento', desc: 'En Vendedores ves cuánto vendió cada uno por día y por medio de pago. En Balance puedes darles acceso al cierre de caja sin mostrar ganancias.' },
      { icon: Users,    color: 'bg-slate-600',   title: 'Bajas y reactivaciones', desc: 'Si alguien se va, dale de baja: pierde el acceso pero su historial se conserva. Si vuelve, reactívalo con el mismo correo.' },
    ],
  },
  ajustes: {
    title: 'Moneda, teléfonos e idioma',
    subtitle: 'Ajusta la app a tu país',
    icon: Globe, color: 'bg-teal-50', iconColor: 'text-teal-600',
    steps: [
      { icon: Coins,  color: 'bg-teal-500',   title: 'Moneda del negocio', desc: 'En Ajustes › Mi negocio el dueño elige la moneda (soles, dólares, euros…). Cambia el símbolo en toda la app, los PDF y los gráficos; no convierte montos.' },
      { icon: Phone,  color: 'bg-blue-500',   title: 'Teléfonos con prefijo', desc: 'Al registrar un cliente o proveedor eliges el país del número. Así WhatsApp abre el chat correcto aunque el cliente sea de otro país.' },
      { icon: Globe,  color: 'bg-indigo-500', title: 'Idioma', desc: 'Español, inglés o italiano desde el selector de arriba. Cada persona elige el suyo; no afecta a los demás.' },
      { icon: Moon,   color: 'bg-slate-700',  title: 'Modo oscuro', desc: 'En Ajustes › Apariencia. Se recuerda en este dispositivo y sigue el tema del sistema si no lo fijas.' },
      { icon: Smartphone, color: 'bg-emerald-600', title: 'Instálala', desc: 'Desde Ajustes › Instalar app la tienes en la pantalla de inicio del celular o en el escritorio, a pantalla completa.' },
    ],
  },
}

export const GUIDE_ORDER = ['venta', 'fiado', 'cotizacion', 'stock', 'empleados', 'ajustes']
