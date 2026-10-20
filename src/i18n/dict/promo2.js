// Regla POST-PROMO (Frank, 20-oct-2026, task 1018): después del 15 de diciembre, 1 mes
// gratis sin tarjeta y el segundo mes al 50 %. Los fundadores siguen con su texto (promo.js).
// {trial} llega ya traducido («1 mes» / «1 month» / «1 mese», ver trialLengthLabel). El español es la llave.
export default {
  en: {
    // ── frase de la prueba y coletilla del descuento (plans.js: trialLine / afterPromoLine)
    '{trial} gratis, sin tarjeta': '{trial} free, no card',
    'y el segundo mes a mitad de precio': 'and the second month at half price',
    'El segundo mes a mitad de precio': 'The second month at half price',
    'y el segundo mes con {apct} % de descuento': 'and the second month with {apct}% off',
    'El segundo mes con {apct} % de descuento': 'The second month with {apct}% off',
    'y los {amonths} meses siguientes con {apct} % de descuento': 'and the next {amonths} months with {apct}% off',
    'Los {amonths} meses siguientes con {apct} % de descuento': 'The next {amonths} months with {apct}% off',
    // ── oferta, FAQ y precios después de la promo
    'Creas tu cuenta en un minuto y usas todo Eazy Stock con tu negocio real durante {trial}, sin tarjeta. El segundo mes lo pagas al {apct} % y, si no te ordena la tienda, no nos debes nada.': 'Create your account in a minute and use all of Eazy Stock with your real business for {trial}, no card. The second month you pay {apct}% of the price and, if it doesn\'t put your store in order, you owe us nothing.',
    'Hasta el {date}, para quien se registra antes de esa fecha. Después, cada cuenta nueva tiene {trial} gratis y el segundo mes al {apct} %. La promo no pide tarjeta: la pones solo cuando decides seguir.': 'Until {date}, for anyone who signs up before that date. Afterwards, each new account gets {trial} free and the second month at {apct}% of the price. The promo asks for no card: you add one only when you decide to continue.',
    'Gratis hasta el {date} para quien se registra antes, sin tarjeta; después, {trial} gratis y el segundo mes al {apct} %. Hay tres planes: Basic (1 negocio, hasta 5 trabajadores), Pro (hasta 3 negocios y 20 trabajadores) y AI (todo lo de Pro, sin límites y con inteligencia artificial). Los primeros {n} negocios pagan la mitad los primeros {months} meses.': 'Free until {date} for anyone who signs up before, no card; afterwards, {trial} free and the second month at {apct}% of the price. There are three plans: Basic (1 business, up to 5 workers), Pro (up to 3 businesses and 20 workers) and AI (everything in Pro, no limits, with artificial intelligence). The first {n} businesses pay half for the first {months} months.',
    '{trial} gratis, sin tarjeta, y el segundo mes al {apct} %. Pagas por el tamaño de tu negocio, no por funciones escondidas.': '{trial} free, no card, and the second month at {apct}% of the price. You pay for the size of your business, not for hidden features.',
    'Planes Basic, Pro y AI de Eazy Stock: desde 1 negocio y 5 trabajadores hasta negocios ilimitados con inteligencia artificial. {trial} gratis sin tarjeta y el segundo mes al {apct} %.': 'Eazy Stock Basic, Pro and AI plans: from 1 business and 5 workers to unlimited businesses with artificial intelligence. {trial} free with no card and the second month at {apct}% of the price.',
    // ── registro
    '{trial} gratis con tu negocio real, sin tarjeta': '{trial} free with your real business, no card',
    'Crea tu cuenta de Eazy Stock en un minuto: {trial} gratis, sin tarjeta, con tu negocio real.': 'Create your Eazy Stock account in a minute: {trial} free, no card, with your real business.',
  },
  it: {
    '{trial} gratis, sin tarjeta': '{trial} gratis, senza carta',
    'y el segundo mes a mitad de precio': 'e il secondo mese a metà prezzo',
    'El segundo mes a mitad de precio': 'Il secondo mese a metà prezzo',
    'y el segundo mes con {apct} % de descuento': 'e il secondo mese con il {apct}% di sconto',
    'El segundo mes con {apct} % de descuento': 'Il secondo mese con il {apct}% di sconto',
    'y los {amonths} meses siguientes con {apct} % de descuento': 'e i {amonths} mesi successivi con il {apct}% di sconto',
    'Los {amonths} meses siguientes con {apct} % de descuento': 'I {amonths} mesi successivi con il {apct}% di sconto',
    'Creas tu cuenta en un minuto y usas todo Eazy Stock con tu negocio real durante {trial}, sin tarjeta. El segundo mes lo pagas al {apct} % y, si no te ordena la tienda, no nos debes nada.': 'Crei il tuo account in un minuto e usi tutto Eazy Stock con il tuo negozio vero per {trial}, senza carta. Il secondo mese lo paghi al {apct}% e, se non ti mette in ordine il negozio, non ci devi nulla.',
    'Hasta el {date}, para quien se registra antes de esa fecha. Después, cada cuenta nueva tiene {trial} gratis y el segundo mes al {apct} %. La promo no pide tarjeta: la pones solo cuando decides seguir.': 'Fino al {date}, per chi si registra prima di quella data. Dopo, ogni nuovo account ha {trial} gratis e il secondo mese al {apct}%. La promo non chiede la carta: la inserisci solo quando decidi di continuare.',
    'Gratis hasta el {date} para quien se registra antes, sin tarjeta; después, {trial} gratis y el segundo mes al {apct} %. Hay tres planes: Basic (1 negocio, hasta 5 trabajadores), Pro (hasta 3 negocios y 20 trabajadores) y AI (todo lo de Pro, sin límites y con inteligencia artificial). Los primeros {n} negocios pagan la mitad los primeros {months} meses.': 'Gratis fino al {date} per chi si registra prima, senza carta; dopo, {trial} gratis e il secondo mese al {apct}%. Ci sono tre piani: Basic (1 attività, fino a 5 collaboratori), Pro (fino a 3 attività e 20 collaboratori) e AI (tutto Pro, senza limiti e con intelligenza artificiale). Le prime {n} attività pagano la metà per i primi {months} mesi.',
    '{trial} gratis, sin tarjeta, y el segundo mes al {apct} %. Pagas por el tamaño de tu negocio, no por funciones escondidas.': '{trial} gratis, senza carta, e il secondo mese al {apct}%. Paghi per la dimensione della tua attività, non per funzioni nascoste.',
    'Planes Basic, Pro y AI de Eazy Stock: desde 1 negocio y 5 trabajadores hasta negocios ilimitados con inteligencia artificial. {trial} gratis sin tarjeta y el segundo mes al {apct} %.': 'Piani Basic, Pro e AI di Eazy Stock: da 1 attività e 5 collaboratori ad attività illimitate con intelligenza artificiale. {trial} gratis senza carta e il secondo mese al {apct}%.',
    '{trial} gratis con tu negocio real, sin tarjeta': '{trial} gratis con il tuo negozio vero, senza carta',
    'Crea tu cuenta de Eazy Stock en un minuto: {trial} gratis, sin tarjeta, con tu negocio real.': 'Crea il tuo account Eazy Stock in un minuto: {trial} gratis, senza carta, con il tuo negozio vero.',
  },
}
