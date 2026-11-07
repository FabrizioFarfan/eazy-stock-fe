// Páginas por rubro para Google (Frank, 7-nov-2026: nadie nos encuentra). En español, nuestro mercado es Latinoamérica.
// Solo lo que la app hace hoy (regla del 28-oct: lo que no está hecho no se anuncia) y sin clientes ni cifras inventados.

export const INDUSTRY_PAGES = [
  {
    slug: 'ferreterias',
    name: 'Ferreterías',
    title: 'Sistema para ferreterías: stock, ventas y fiado | Eazy Stock',
    description: 'Sistema de inventario para ferreterías en Perú y Latinoamérica: productos por medida, fiado, cotizaciones en PDF y pedidos al proveedor por WhatsApp. Gratis para empezar.',
    heading: 'El sistema para tu ferretería',
    highlight: 'sin dejar el mostrador.',
    sub: 'Miles de productos parecidos, precios que cambian y clientes que pagan a fin de mes. Eazy Stock lo ordena sin que tengas que ser contador.',
    pains: [
      ['Mismo producto, muchas medidas', 'Busca por color, material, largo o peso y vende por unidad, kilo o metro, con los decimales que necesites.'],
      ['El proveedor te sube el precio', 'Al registrar la compra ves cuánto subió y cuánto ganas ahora, y decides si cambias tu precio de venta.'],
      ['El maestro te paga a fin de mes', 'Cada cliente con su deuda al día, su límite y su estado de cuenta en PDF para mandarlo por WhatsApp.'],
    ],
    features: ['Cotizaciones en PDF', 'Pedido al proveedor por WhatsApp', 'Aviso de stock bajo', 'Código del proveedor en cada producto', 'Sube tu lista desde Excel', 'Cierre de caja'],
  },
  {
    slug: 'bodegas',
    name: 'Bodegas',
    title: 'Sistema para bodegas: inventario, caja y fiado | Eazy Stock',
    description: 'Deja el cuaderno de tu bodega: controla stock, cobra con efectivo, Yape o Plin, lleva el fiado y cierra la caja sabiendo cuánto ganaste. Gratis para empezar.',
    heading: 'Tu bodega, sin cuaderno',
    highlight: 'y con la caja clara.',
    sub: 'Sabes qué te queda, quién te debe y cuánto entró hoy. Desde el celular, entre cliente y cliente.',
    pains: [
      ['El cuaderno del fiado', 'La deuda de cada vecino al día y el recordatorio listo para mandarlo por WhatsApp.'],
      ['Te enteras tarde de que se acabó', 'La app te avisa qué está por acabarse y qué está por vencer, antes de perder la venta.'],
      ['Al cerrar, la caja no cuadra', 'Efectivo, Yape, Plin y tarjeta por separado: al final del día sabes cuánto debe haber en el cajón.'],
    ],
    features: ['Venta rápida con escáner', 'Fondo y cierre de caja', 'Gastos fijos del mes', 'Productos por vencer', 'Reportes de lo que más se vende', 'Sube tu lista desde Excel'],
  },
  {
    slug: 'farmacias',
    name: 'Farmacias',
    title: 'Sistema para farmacias y boticas: stock y vencimientos | Eazy Stock',
    description: 'Controla el stock de tu farmacia o botica, recibe avisos de productos por vencer y vende rápido con escáner. Gratis para empezar.',
    heading: 'Tu farmacia o botica,',
    highlight: 'sin productos vencidos en el estante.',
    sub: 'Controla fechas de vencimiento, stock mínimo y dónde está cada producto, y vende rápido con el escáner.',
    pains: [
      ['Se te vence la mercadería', 'Guarda la fecha de vencimiento y recibe el aviso antes de que llegue.'],
      ['Nadie encuentra el producto', 'Cada producto con su ubicación, su foto y su código de barras.'],
      ['Empleados y caja', 'Cada empleado con sus permisos: el vendedor vende y no ve lo que te costó.'],
    ],
    features: ['Aviso de productos por vencer', 'Venta rápida con escáner', 'Ubicaciones en el local', 'Aviso de stock bajo', 'Permisos por empleado', 'Cierre de caja'],
  },
  {
    slug: 'minimarkets',
    name: 'Minimarkets',
    title: 'Sistema para minimarkets: caja, stock y empleados | Eazy Stock',
    description: 'Cobra rápido con escáner, controla tu stock y a tus empleados, y mira qué se vende más en tu minimarket. Gratis para empezar.',
    heading: 'Tu minimarket, ordenado',
    highlight: 'aunque tú no estés.',
    sub: 'Cobro rápido con escáner, empleados con permisos y reportes que te dicen qué comprar y qué se queda en el estante.',
    pains: [
      ['Cola en la caja', 'Escanea, cobra con el medio de pago que sea y pasa al siguiente cliente.'],
      ['No sabes qué pasa cuando no estás', 'Cada venta queda con quién la hizo, y al cierre sabes cuánto debe haber en caja.'],
      ['Compras a ojo', 'Mira lo que más se vende y arma el pedido al proveedor con lo que hace falta.'],
    ],
    features: ['Venta rápida con escáner', 'Rendimiento por vendedor', 'Pedido al proveedor', 'Productos por vencer', 'Compras y gastos', 'Reportes de lo que más se vende'],
  },
]

export const INDUSTRY_BY_SLUG = Object.fromEntries(INDUSTRY_PAGES.map((p) => [p.slug, p]))
export const industryPath = (slug) => `/sistema-para/${slug}`
