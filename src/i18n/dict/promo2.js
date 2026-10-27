// Regla POST-PROMO (Frank, 20-oct-2026, task 1018): después del 15 de diciembre, 1 mes
// gratis sin tarjeta. Sin descuento de lanzamiento desde el 27-oct-2026 (fuera el segundo mes
// rebajado y los fundadores).
// {trial} llega ya traducido («1 mes» / «1 month» / «1 mese», ver trialLengthLabel). El español es la llave.
export default {
  en: {
    // ── sin descuento de lanzamiento (27-oct-2026)
    'Después, un plan según el tamaño de tu negocio.': 'Afterwards, a plan sized to your business.',
    'Gratis hasta el {date} para quien se registra antes, sin tarjeta; después, {trial} gratis. Hay tres planes: Basic (1 negocio, hasta 5 trabajadores), Pro (hasta 3 negocios y 20 trabajadores) y AI (todo lo de Pro, sin límites y con inteligencia artificial).': 'Free until {date} for anyone who signs up before, no card; afterwards, {trial} free. There are three plans: Basic (1 business, up to 5 workers), Pro (up to 3 businesses and 20 workers) and AI (everything in Pro, no limits, with artificial intelligence).',
    'Creas tu cuenta en un minuto y usas todo Eazy Stock con tu negocio real durante {trial}, sin tarjeta. Recién entonces eliges tu plan; si no te ordena la tienda, no nos debes nada.': 'Create your account in a minute and use all of Eazy Stock with your real business for {trial}, no card. Only then do you choose a plan; if it doesn\'t put your store in order, you owe us nothing.',
    'Hasta el {date}, para quien se registra antes de esa fecha. Después, cada cuenta nueva tiene {trial} gratis. La promo no pide tarjeta: la pones solo cuando decides seguir.': 'Until {date}, for anyone who signs up before that date. Afterwards, each new account gets {trial} free. The promo asks for no card: you add one only when you decide to continue.',
    'Gratis hasta el {date}, sin tarjeta. Pagas por el tamaño de tu negocio, no por funciones escondidas.': 'Free until {date}, no card. You pay for the size of your business, not for hidden features.',
    '{trial} gratis, sin tarjeta. Pagas por el tamaño de tu negocio, no por funciones escondidas.': '{trial} free, no card. You pay for the size of your business, not for hidden features.',
    'Planes Basic, Pro y AI de Eazy Stock: desde 1 negocio y 5 trabajadores hasta negocios ilimitados con inteligencia artificial. Gratis hasta el {date} sin tarjeta.': 'Eazy Stock Basic, Pro and AI plans: from 1 business and 5 workers to unlimited businesses with artificial intelligence. Free until {date} with no card.',
    'Planes Basic, Pro y AI de Eazy Stock: desde 1 negocio y 5 trabajadores hasta negocios ilimitados con inteligencia artificial. {trial} gratis sin tarjeta.': 'Eazy Stock Basic, Pro and AI plans: from 1 business and 5 workers to unlimited businesses with artificial intelligence. {trial} free with no card.',
    'Vacío = sin vencimiento': 'Empty = no expiry',
    // ── frase de la prueba y coletilla del descuento (plans.js: trialLine / afterPromoLine)
    '{trial} gratis, sin tarjeta': '{trial} free, no card',
    // ── oferta, FAQ y precios después de la promo
    // ── registro
    '{trial} gratis con tu negocio real, sin tarjeta': '{trial} free with your real business, no card',
    'Crea tu cuenta de Eazy Stock en un minuto: {trial} gratis, sin tarjeta, con tu negocio real.': 'Create your Eazy Stock account in a minute: {trial} free, no card, with your real business.',
  },
  it: {
    'Después, un plan según el tamaño de tu negocio.': 'Poi, un piano in base alla dimensione della tua attività.',
    'Gratis hasta el {date} para quien se registra antes, sin tarjeta; después, {trial} gratis. Hay tres planes: Basic (1 negocio, hasta 5 trabajadores), Pro (hasta 3 negocios y 20 trabajadores) y AI (todo lo de Pro, sin límites y con inteligencia artificial).': 'Gratis fino al {date} per chi si registra prima, senza carta; dopo, {trial} gratis. Ci sono tre piani: Basic (1 attività, fino a 5 collaboratori), Pro (fino a 3 attività e 20 collaboratori) e AI (tutto Pro, senza limiti e con intelligenza artificiale).',
    'Creas tu cuenta en un minuto y usas todo Eazy Stock con tu negocio real durante {trial}, sin tarjeta. Recién entonces eliges tu plan; si no te ordena la tienda, no nos debes nada.': 'Crei il tuo account in un minuto e usi tutto Eazy Stock con il tuo negozio vero per {trial}, senza carta. Solo allora scegli il piano; se non ti mette in ordine il negozio, non ci devi nulla.',
    'Hasta el {date}, para quien se registra antes de esa fecha. Después, cada cuenta nueva tiene {trial} gratis. La promo no pide tarjeta: la pones solo cuando decides seguir.': 'Fino al {date}, per chi si registra prima di quella data. Dopo, ogni nuovo account ha {trial} gratis. La promo non chiede la carta: la inserisci solo quando decidi di continuare.',
    'Gratis hasta el {date}, sin tarjeta. Pagas por el tamaño de tu negocio, no por funciones escondidas.': 'Gratis fino al {date}, senza carta. Paghi per la dimensione della tua attività, non per funzioni nascoste.',
    '{trial} gratis, sin tarjeta. Pagas por el tamaño de tu negocio, no por funciones escondidas.': '{trial} gratis, senza carta. Paghi per la dimensione della tua attività, non per funzioni nascoste.',
    'Planes Basic, Pro y AI de Eazy Stock: desde 1 negocio y 5 trabajadores hasta negocios ilimitados con inteligencia artificial. Gratis hasta el {date} sin tarjeta.': 'Piani Basic, Pro e AI di Eazy Stock: da 1 attività e 5 collaboratori ad attività illimitate con intelligenza artificiale. Gratis fino al {date} senza carta.',
    'Planes Basic, Pro y AI de Eazy Stock: desde 1 negocio y 5 trabajadores hasta negocios ilimitados con inteligencia artificial. {trial} gratis sin tarjeta.': 'Piani Basic, Pro e AI di Eazy Stock: da 1 attività e 5 collaboratori ad attività illimitate con intelligenza artificiale. {trial} gratis senza carta.',
    'Vacío = sin vencimiento': 'Vuoto = senza scadenza',
    '{trial} gratis, sin tarjeta': '{trial} gratis, senza carta',
    '{trial} gratis con tu negocio real, sin tarjeta': '{trial} gratis con il tuo negozio vero, senza carta',
    'Crea tu cuenta de Eazy Stock en un minuto: {trial} gratis, sin tarjeta, con tu negocio real.': 'Crea il tuo account Eazy Stock in un minuto: {trial} gratis, senza carta, con il tuo negozio vero.',
  },
}
