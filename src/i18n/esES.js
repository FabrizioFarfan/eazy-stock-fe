// Capa «español de España» (multi-país, 24-oct-2026; solo la web).
//
// Cuando el negocio es de España (o, sin sesión, el navegador está en es-ES)
// la UI en español dice «móvil», «ordenador» y «presupuesto» en lugar de
// «celular», «computadora» y «cotización». No se duplica ningún diccionario:
// las llaves en español pasan por `spainVariant()`, que aplica
//   1. OVERRIDES: frases enteras donde cambia algo más que la palabra
//      (pronombres «la/compártela» → «lo/compártelo», adjetivos en femenino…);
//   2. reglas por palabra con el artículo y el adjetivo pegados
//      («la cotización» → «el presupuesto», «Nueva cotización» → «Nuevo presupuesto»).
// Lo revisado frase por frase está en scripts/es-es-review.mjs (vuelca todas las
// llaves afectadas con su versión de España).

/** Frases donde las reglas no bastan (concordancia lejos de la palabra). */
export const OVERRIDES = {
  'Arma una cotización con los mismos productos de tu catálogo, compártela con el cliente y conviértela en venta cuando la apruebe.':
    'Arma un presupuesto con los mismos productos de tu catálogo, compártelo con el cliente y conviértelo en venta cuando lo apruebe.',
  'Arma una cotización con tu catálogo, descárgala en PDF o envíala por WhatsApp y correo, y conviértela en venta cuando el cliente la apruebe.':
    'Arma un presupuesto con tu catálogo, descárgalo en PDF o envíalo por WhatsApp y correo, y conviértelo en venta cuando el cliente lo apruebe.',
  'Arma una cotización en segundos y expórtala en PDF para enviarla por WhatsApp o correo. No descuenta stock ni registra una venta.':
    'Arma un presupuesto en segundos y expórtalo en PDF para enviarlo por WhatsApp o correo. No descuenta stock ni registra una venta.',
  'Cada cotización generada queda guardada con su número. En «Historial» la buscas por cliente, teléfono, número o producto, la reimprimes, o con «Vender estos productos» pasas todas sus líneas a una venta nueva sin cargarlas una por una.':
    'Cada presupuesto generado queda guardado con su número. En «Historial» lo buscas por cliente, teléfono, número o producto, lo reimprimes, o con «Vender estos productos» pasas todas sus líneas a una venta nueva sin cargarlas una por una.',
  'Cada cotización que generas queda aquí con su número, fecha, cliente y total.':
    'Cada presupuesto que generas queda aquí con su número, fecha, cliente y total.',
  'Cotización borrada': 'Presupuesto borrado',
  'Cotización {n} actualizada': 'Presupuesto {n} actualizado',
  'Cotización {n} lista': 'Presupuesto {n} listo',
  'Cotización N.º {n} guardada en el historial': 'Presupuesto N.º {n} guardado en el historial',
  'Cuando el cliente acepte, toca «Vender estos productos»: el carrito se llena solo y la cotización queda marcada como vendida.':
    'Cuando el cliente acepte, toca «Vender estos productos»: el carrito se llena solo y el presupuesto queda marcado como vendido.',
  'Crear una cotización (presupuesto) para un cliente': 'Crear un presupuesto para un cliente',
  'Descárgala en PDF, imprímela o envíala por WhatsApp o correo. En el celular el PDF va adjunto de una; en la PC se descarga y se abre el chat con el mensaje listo.':
    'Descárgalo en PDF, imprímelo o envíalo por WhatsApp o correo. En el móvil el PDF va adjunto de una; en el ordenador se descarga y se abre el chat con el mensaje listo.',
  'En Cotización busca productos del catálogo igual que en una venta. No descuenta stock ni registra ninguna venta: es solo un presupuesto.':
    'En Presupuesto busca productos del catálogo igual que en una venta. No descuenta stock ni registra ninguna venta: es solo una propuesta de precios.',
  'Este documento es una cotización referencial y no constituye comprobante de pago.':
    'Este documento es un presupuesto referencial y no constituye comprobante de pago.',
  'Salir — la cotización queda guardada': 'Salir — el presupuesto queda guardado',
  'Tienes productos cotizados. Puedes salir tranquilo: la cotización queda guardada y sigue donde la dejaste cuando vuelvas.':
    'Tienes productos presupuestados. Puedes salir tranquilo: el presupuesto queda guardado y sigue donde lo dejaste cuando vuelvas.',
  'Todas quedan en Cotizaciones › Historial con su número. Puedes editar las abiertas, duplicar una vieja con los precios de hoy y ver las de cada cliente en su ficha.':
    'Todos quedan en Presupuestos › Historial con su número. Puedes editar los abiertos, duplicar uno viejo con los precios de hoy y ver los de cada cliente en su ficha.',
  'Todavía no has generado cotizaciones': 'Todavía no has generado presupuestos',
  'Todavía no le hiciste ninguna cotización': 'Todavía no le hiciste ningún presupuesto',
  'Tu navegador bloqueó la ventana de impresión. La cotización quedó guardada: puedes imprimirla desde el historial.':
    'Tu navegador bloqueó la ventana de impresión. El presupuesto quedó guardado: puedes imprimirlo desde el historial.',
  'Tus cotizaciones guardadas': 'Tus presupuestos guardados',
  'Una cotización abierta se puede editar (conserva su número). «Duplicar» arma una cotización nueva con los mismos productos a precio de hoy — sirve para re-cotizar a un cliente que vuelve, incluso desde una ya vendida.':
    'Un presupuesto abierto se puede editar (conserva su número). «Duplicar» arma un presupuesto nuevo con los mismos productos a precio de hoy — sirve para volver a presupuestar a un cliente que vuelve, incluso desde uno ya vendido.',
  'Una cotización vendida no se puede editar. Usa «Duplicar» para re-cotizarla.':
    'Un presupuesto vendido no se puede editar. Usa «Duplicar» para volver a presupuestarlo.',
  'Ajusta productos, cliente o notas. La cotización conserva su número y su fecha.':
    'Ajusta productos, cliente o notas. El presupuesto conserva su número y su fecha.',
  'Ya tienes una cotización a medias': 'Ya tienes un presupuesto a medias',
  'El cliente volvió y quiere lo cotizado: abre la cotización y pulsa «Vender estos productos». Se arma una venta nueva con todas las líneas y los precios cotizados; ahí ajustas cantidades si hace falta y cobras. Al cobrar, la cotización queda marcada como «Vendida».':
    'El cliente volvió y quiere lo presupuestado: abre el presupuesto y pulsa «Vender estos productos». Se arma una venta nueva con todas las líneas y los precios presupuestados; ahí ajustas cantidades si hace falta y cobras. Al cobrar, el presupuesto queda marcado como «Vendido».',
  'Por medio de la presente solicitamos cotización y despacho de los siguientes productos:':
    'Por medio de la presente solicitamos presupuesto y envío de los siguientes productos:',
  'Si sigues, esa cotización se reemplaza por la copia de esta.': 'Si sigues, ese presupuesto se reemplaza por la copia de este.',
  'Cómo hacer una cotización': 'Cómo hacer un presupuesto',
  'Qué es una cotización': 'Qué es un presupuesto',
  'cotizacion': 'presupuesto',
  // Sin la palabra pero solo se usan para la cotización (estado, validez):
  'Abierta': 'Abierto',
  'Abiertas': 'Abiertos',
  'Vendida': 'Vendido',
  'Vendidas': 'Vendidos',
  'Válida hasta': 'Válido hasta',
  'Es válida por {n} día(s).': 'Es válido por {n} día(s).',
  'Todas las cotizaciones': 'Todos los presupuestos',
}

// Reglas por palabra. El orden importa: primero las que se llevan el artículo
// o el adjetivo, al final la palabra suelta. `\b` no sirve con tildes: se usan
// límites a mano (letra = [\p{L}]).
const L = '(?<![\\p{L}])'
const R = '(?![\\p{L}])'
const rule = (from, to) => [new RegExp(L + from + R, 'gu'), to]

const RULES = [
  // cotización → presupuesto (femenino → masculino)
  rule('de la cotización', 'del presupuesto'),
  rule('a la cotización', 'al presupuesto'),
  rule('la cotización', 'el presupuesto'),
  rule('La cotización', 'El presupuesto'),
  rule('una cotización', 'un presupuesto'),
  rule('Una cotización', 'Un presupuesto'),
  rule('esta cotización', 'este presupuesto'),
  rule('Esta cotización', 'Este presupuesto'),
  rule('esa cotización', 'ese presupuesto'),
  rule('ninguna cotización', 'ningún presupuesto'),
  rule('Nueva cotización', 'Nuevo presupuesto'),
  rule('nueva cotización', 'nuevo presupuesto'),
  rule('tu cotización en curso', 'tu presupuesto en curso'),
  rule('las cotizaciones', 'los presupuestos'),
  rule('Las cotizaciones', 'Los presupuestos'),
  rule('cotizaciones', 'presupuestos'),
  rule('Cotizaciones', 'Presupuestos'),
  rule('COTIZACIONES', 'PRESUPUESTOS'),
  rule('cotización', 'presupuesto'),
  rule('Cotización', 'Presupuesto'),
  rule('COTIZACIÓN', 'PRESUPUESTO'),
  rule('cotizados', 'presupuestados'),
  rule('cotizado', 'presupuestado'),
  // computadora → ordenador (femenino → masculino)
  rule('de la computadora', 'del ordenador'),
  rule('a la computadora', 'al ordenador'),
  rule('la computadora', 'el ordenador'),
  rule('La computadora', 'El ordenador'),
  rule('una computadora', 'un ordenador'),
  rule('tu computadora', 'tu ordenador'),
  rule('computadoras', 'ordenadores'),
  rule('Computadoras', 'Ordenadores'),
  rule('computadora', 'ordenador'),
  rule('Computadora', 'Ordenador'),
  // celular → móvil (los dos masculinos)
  rule('celulares', 'móviles'),
  rule('Celulares', 'Móviles'),
  rule('celular', 'móvil'),
  rule('Celular', 'Móvil'),
  rule('CELULAR', 'MÓVIL'),
]

const TOUCHES = /celular|computadora|cotiza/i
const cache = new Map()

/** La versión de España de un texto en español (llave del diccionario o plantilla). */
export function spainVariant(str) {
  if (typeof str !== 'string') return str
  const over = OVERRIDES[str]
  if (over !== undefined) return over
  if (!TOUCHES.test(str)) return str
  const hit = cache.get(str)
  if (hit !== undefined) return hit
  let out = str
  for (const [re, to] of RULES) out = out.replace(re, to)
  cache.set(str, out)
  return out
}
