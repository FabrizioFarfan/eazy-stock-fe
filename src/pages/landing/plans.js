// ═══════════════════════════════════════════════════════════════════════════
//  PLANES Y OFERTAS de Eazy Stock (17-sep-2026, plan M1 «Plans & feature gating»)
//
//  Un solo sitio para los números: la sección «Precios» de la landing y la
//  página /planes leen de aquí. Los PRECIOS son de REFERENCIA hasta que Frank
//  dicte los definitivos (M2 «Real payments» define proveedor y moneda PEN).
//  Los límites SÍ están decididos: Basic 1 negocio / 5 trabajadores,
//  Pro ilimitado, AI = Pro + inteligencia artificial.
// ═══════════════════════════════════════════════════════════════════════════

export const CURRENCY = 'S/'
/** Prueba gratis sin tarjeta (Frank, 15-oct-2026: «2 semanas free»). El BE la aplica en /auth/register. */
export const TRIAL_DAYS = 14
/** Meses que se regalan al pagar el año entero (10 × mensual = 12 meses). */
export const YEARLY_FREE_MONTHS = 2
/** Oferta de lanzamiento (Frank, 15-oct-2026, «50 % los primeros 6 meses, vemos»): la aplica el BE al registrarse. */
export const LAUNCH_DISCOUNT_PERCENT = 50
export const LAUNCH_DISCOUNT_MONTHS = 6

// ── Promo de lanzamiento (Frank + Fabrizio, 19-oct-2026, task 1001) ──────────
/** Gratis hasta esta fecha, sin tarjeta, para quien se registra antes; el BE manda (app.promo.free-until). */
export const PROMO_FREE_UNTIL = '2026-12-15'
/** Los primeros N negocios son «fundadores»: descuento de lanzamiento y precio bloqueado. */
export const FOUNDERS_LIMIT = 50
/** Día del mes en que se cobra la suscripción. */
export const BILLING_DAY = 15

export function promoActive(today = new Date()) {
  return today.toISOString().slice(0, 10) <= PROMO_FREE_UNTIL
}

/** «15 de diciembre» / «December 15» / «15 dicembre» según el idioma activo. */
export function promoFreeUntilLabel(locale = 'es-PE', withYear = false) {
  const d = new Date(`${PROMO_FREE_UNTIL}T12:00:00`)
  return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', ...(withYear ? { year: 'numeric' } : {}) }).format(d)
}

/** Variables para los textos de la promo: {date}, {days}, {n}, {pct}, {months}, {day}. */
export function promoVars(locale) {
  return { date: promoFreeUntilLabel(locale), days: TRIAL_DAYS, n: FOUNDERS_LIMIT, pct: LAUNCH_DISCOUNT_PERCENT, months: LAUNCH_DISCOUNT_MONTHS, day: BILLING_DAY }
}

/**
 * Frase corta de la prueba gratis: durante la promo «Gratis hasta el 15 de diciembre, sin tarjeta»;
 * después vuelve a «14 días gratis, sin tarjeta». `t` es el traductor activo.
 */
export function trialLine(t, locale) {
  return promoActive()
    ? t('Gratis hasta el {date}, sin tarjeta', promoVars(locale))
    : t('{days} días gratis, sin tarjeta', { days: TRIAL_DAYS })
}

export const PLANS = [
  {
    key: 'basic',
    name: 'Basic',
    tagline: 'Para una tienda que quiere dejar el cuaderno.',
    monthly: 39,
    tone: 'from-slate-500 to-slate-700',
    limits: [
      ['1', 'negocio'],
      ['5', 'trabajadores'],
    ],
    features: [
      'Inventario, ventas, fiado y recepciones',
      'Cierre de caja por medio de pago',
      'Cotizaciones y estado de cuenta en PDF',
      'Importar y exportar desde Excel',
      'Reportes: ventas, vencimientos, mejores clientes',
      'Tutoriales en cada pantalla · ES · EN · IT',
    ],
    cta: 'Empezar con Basic',
  },
  {
    key: 'pro',
    name: 'Pro',
    tagline: 'Para el dueño con más de una tienda o un equipo grande.',
    monthly: 89,
    tone: 'from-blue-600 to-indigo-600',
    highlight: true,
    badge: 'Más elegido',
    limits: [
      ['∞', 'negocios'],
      ['∞', 'trabajadores'],
    ],
    features: [
      'Todo lo de Basic',
      'Negocios ilimitados en una sola cuenta',
      'Trabajadores ilimitados con permisos por persona',
      'Panel del dueño: todas tus tiendas en una pantalla',
      'Cambia de negocio sin cerrar sesión',
      'Soporte prioritario por WhatsApp',
    ],
    cta: 'Empezar con Pro',
  },
  {
    key: 'ai',
    name: 'AI',
    tagline: 'Para vender hablando y dejar que la IA mire tus números.',
    monthly: 149,
    tone: 'from-violet-500 to-fuchsia-600',
    badge: 'Con IA',
    limits: [
      ['∞', 'negocios'],
      ['∞', 'trabajadores'],
    ],
    features: [
      'Todo lo de Pro',
      'Ventas por nota de voz: dictas y confirmas',
      'Análisis: lo que más vendes, lo lento y lo que vence',
      'Ofertas sugeridas que tú apruebas',
      'Clientes con consentimiento para recibir ofertas',
      'Envío de ofertas por WhatsApp o SMS con resultados',
    ],
    cta: 'Empezar con AI',
  },
]

/** Filas de la tabla comparativa de /planes: [texto, basic, pro, ai]. true = ✓, string = texto. */
export const COMPARE = [
  ['Negocios',                                  '1',            'Ilimitados', 'Ilimitados'],
  ['Trabajadores',                              'Hasta 5',      'Ilimitados', 'Ilimitados'],
  ['Inventario, ventas, fiado y recepciones',   true, true, true],
  ['Cierre de caja y fondo de caja',            true, true, true],
  ['Cotizaciones y pedidos al proveedor en PDF',true, true, true],
  ['Importar / exportar Excel',                 true, true, true],
  ['Reportes y análisis de clientes',           true, true, true],
  ['Permisos por trabajador',                   true, true, true],
  ['Panel del dueño con varios negocios',       false, true, true],
  ['Soporte prioritario por WhatsApp',          false, true, true],
  ['Ventas por nota de voz',                    false, false, true],
  ['Análisis de ventas con IA',                 false, false, true],
  ['Ofertas sugeridas y envío a clientes',      false, false, true],
]

/** Ofertas vigentes: se muestran en la landing y en /planes. */
export const OFFERS = [
  {
    key: 'trial',
    icon: 'Sparkles',
    tone: 'from-amber-400 to-orange-500',
    title: 'Gratis hasta el {date}, sin tarjeta',
    desc: 'Creas tu cuenta en un minuto y usas todo Eazy Stock con tu negocio real, gratis, hasta el {date}. Recién entonces eliges tu plan; si no te ordena la tienda, no nos debes nada.',
    afterPromo: {
      title: '{days} días gratis, sin tarjeta',
      desc: 'Creas tu cuenta en un minuto y usas todo Eazy Stock con tu negocio real durante {days} días. Si no te ordena la tienda, no nos debes nada.',
    },
  },
  {
    key: 'launch',
    icon: 'Lock',
    tone: 'from-blue-500 to-indigo-600',
    title: 'Los primeros {n} negocios pagan la mitad {months} meses',
    desc: 'Si eres de los primeros {n} en registrarte, al terminar la promo pagas {pct} % menos durante {months} meses, en cualquier plan, y conservas el precio de lanzamiento para siempre. En Ajustes › Tu plan ves si entraste.',
  },
  {
    key: 'yearly',
    icon: 'CalendarClock',
    tone: 'from-emerald-500 to-teal-600',
    title: 'Paga el año y llévate 2 meses gratis',
    desc: 'Cualquier plan pagado por año cuesta 10 meses en vez de 12. Y siempre con la prueba gratis primero, sin tarjeta.',
  },
]

export const PLAN_FAQS = [
  ['¿Qué pasa cuando termine la prueba gratis?', 'Eliges tu plan y sigues donde estabas: no se borra nada. Si no eliges, tu cuenta queda en modo lectura hasta que decidas, con todos tus datos intactos.'],
  ['¿Hasta cuándo es gratis?', 'Hasta el {date}, para quien se registra antes de esa fecha. Después, cada cuenta nueva tiene {days} días de prueba. La promo no pide tarjeta: la pones solo cuando decides seguir.'],
  ['¿Qué ganan los primeros {n} negocios?', 'Pagan {pct} % menos durante los primeros {months} meses en cualquier plan y conservan el precio de lanzamiento para siempre. En Ajustes › Tu plan ves si entraste: sí o no.'],
  ['¿Puedo cambiar de plan más adelante?', 'Sí, cuando quieras y desde Ajustes. Al subir de plan el cambio es inmediato. Al bajar, mantienes lo que tienes hasta el cierre del período y te avisamos si algo supera el límite del plan nuevo.'],
  ['Tengo dos tiendas, ¿necesito dos cuentas?', 'No. Con Pro o AI manejas todos tus negocios desde una sola cuenta y un solo panel; cada tienda tiene su stock, su caja y su gente por separado.'],
  ['¿Qué cuenta como trabajador?', 'Cada persona con su propio usuario: vendedores, almacenero, contador. El dueño no cuenta. Un trabajador dado de baja libera su lugar.'],
  ['¿La IA registra ventas sola?', 'Nunca. La IA prepara el borrador de la venta o de la oferta y una persona lo confirma. Si un producto no existe o no hay stock, te lo dice antes de registrar nada.'],
  ['¿Cómo se paga?', 'Con tarjeta desde Ajustes › Tu plan: se cobra el día {day} de cada mes (o una vez al año). También por transferencia o billetera digital escribiéndonos por WhatsApp. Los precios están en soles; en otros países se cobra el equivalente.'],
]

export function yearlyPrice(monthly) {
  return monthly * (12 - YEARLY_FREE_MONTHS)
}
