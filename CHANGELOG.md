# Changelog — Eazy Stock (app web)

Versionado semántico desde el 3-oct-2026 (regla de Frank: cada tanda desplegada sube la versión y la app la muestra).


## 1.21.0 — 2026-10-24 (borrado de cuenta; sube junto al API 1.14.0)
- **Ajustes › Eliminar mi cuenta** (dueño y empleado; BOSS/SUPER_ADMIN no la ven): confirmación escribiendo la contraseña (400 `WRONG_PASSWORD` → «La contraseña no es correcta.») y el aviso de los **30 días** (en ese tiempo nadie usa la cuenta; volver a entrar la reactiva). Textos distintos: el dueño borra su cuenta, su(s) negocio(s) y todos los datos, y su suscripción se cancela al momento; el empleado solo su usuario (sus ventas se quedan en el negocio). Con su ayuda (HelpDrawer). `POST /api/me/account/deletion` → la sesión se cierra en local (`endSessionLocally`: el API ya revocó los tokens, no se llama a `/auth/logout`) y el login muestra «Pediste eliminar tu cuenta» con la fecha de `deletionScheduledAt` (va en sessionStorage, sobrevive a una recarga).
- **Login**: si el AuthResponse trae `accountReactivated: true`, aviso «Cancelamos el borrado de tu cuenta. ¡Qué bueno verte de nuevo!»; un empleado con 403 `BUSINESS_PENDING_DELETION` ve «Este negocio está en proceso de baja.». `login()` del AuthContext devuelve ahora el AuthResponse.
- **Página pública `/eliminar-cuenta`** (alias `/delete-account`) para Google Play: cómo pedirlo (app, web o kontakt.eazylife@gmail.com), qué se borra (dueño / empleado), en cuánto tiempo (30 días) y cómo cancelarlo (volver a entrar). Prerenderizada, en `sitemap.xml` y en la lista de páginas públicas de `index.html`; enlazada desde el pie de la web, la Política de privacidad y Preguntas.
- Textos es/en/it (`dict/accountDeletion.js`).

## 1.20.1 — 2026-10-24 (sube junto al API 1.13.1)
- **Brasil fuera** de «¿Dónde está tu negocio?» y de la lista de países del negocio (por ahora la app es en español). Los teléfonos de clientes siguen aceptando +55.

## 1.20.0 — 2026-10-24 (multi-país LatAm + España y medios de pago por negocio; sube junto al API 1.13.0)
- **Registro por país**: primer paso «¿Dónde está tu negocio?» con los países de `GET /api/countries` (respaldo local en `utils/countries.js` si el API no responde), preseleccionado por `navigator.languages` (es-CO → Colombia, es-ES → España; sin región o no soportado → Perú). Luego el formulario con la moneda del país propuesta, la etiqueta del documento fiscal (RUC, NIF, NIT, CUIT…) y el prefijo de WhatsApp del país. Se ve qué medios de pago trae el país.
- **Formato del negocio en toda la app**: el AuthContext toma de `/auth/me` `currencySymbol`, `currencyDecimals`, `locale`, `dateFormat` y el país. `formatAmount` muestra los decimales del negocio (0 en CLP/COP/PYG) y `formatPrice` al menos esos y hasta 6 si el precio los tiene; las fechas usan el locale del negocio en español (es-ES, es-CO…) y día/mes en inglés (en-GB); `formatNumericDate` sigue el `dateFormat` (dd/MM/yyyy). Llega a los PDFs (cotización/presupuesto, nota de pedido, estado de cuenta, pedido al proveedor) y a los mensajes de WhatsApp (el prefijo del negocio si el número no lo trae, como ya hacía `phone.js`). El documento del proveedor se rotula con el del país (NIF en España) y el `TAX_ID` genérico del API se muestra con la etiqueta del país.
- **Nueva venta**: los botones de «¿Cómo pagó?» son los medios ACTIVOS del negocio (`GET /api/payment-methods`, en su orden) y la venta manda `paymentMethodId` (y el nombre, para un API anterior). Fuera los medios guardados en localStorage y el «Otro…» de texto libre; los borradores viejos con nombre se casan con el medio de ese nombre. Si el dueño lo desactivó mientras se cobraba (400 `PAYMENT_METHOD_INACTIVE`) se recarga la lista y se pide elegir otro. Si el API todavía no tiene medios, se usan los del país sin id.
- **Historial de ventas**: el filtro por medio de pago es la lista del negocio (también los desactivados, en gris) y filtra con `?paymentMethodId=`; «Fiado» sigue igual. Cierre de caja con el nombre actual que manda el API, el ícono del efectivo por `cash` y la clave por `paymentMethodId`.
- **Ajustes › Medios de pago** (solo el dueño, con su ayuda): renombrar, agregar, activar/desactivar, ordenar con flechas o arrastrando la fila y borrar los que nunca se usaron (409 `PAYMENT_METHOD_IN_USE` → «Ya se usó en ventas: desactívalo»); el efectivo no se desactiva ni se borra.
- **Español de España**: con un negocio de España (o sin sesión con el navegador en es-ES, y en el registro al elegir España) se dice «móvil», «ordenador» y «presupuesto(s)» en lugar de «celular», «computadora» y «cotización(es)». Capa `src/i18n/esES.js` sobre las llaves en español (reglas con artículo y concordancia + frases enteras donde cambian pronombres y adjetivos), sin duplicar diccionarios; `node scripts/es-es-review.mjs` vuelca los 102 textos afectados con su versión. La bandera del selector de idioma pasa a 🇪🇸.
- Sin «S/» ni «Yape/Plin» fijos fuera de textos de ayuda, landing y legales: el gasto «Yape / Plin» se lee «Billetera digital» fuera de Perú, «Yape y transferencias no están en el cajón» → «los demás medios», el total vacío del gasto con la moneda del negocio. Países nuevos en Ajustes: Costa Rica, Rep. Dominicana, El Salvador, Guatemala, Honduras, Nicaragua, Panamá. Textos es/en/it (`dict/countries.js`).

## 1.19.0 — 2026-10-24 (el vendedor anota lo que llega sin ver precios; sube junto al API 1.12.0)
- **«Anotar lo que llegó»** en Stock para el vendedor con «Recibir mercadería» (antes el permiso no le dejaba hacer nada): proveedor, productos (buscador o escáner) y cantidades; ni costo, ni total, ni contado/crédito, ni deuda del proveedor. `SupplierReceiptModal simple` → `POST /api/receipts/simple`. Crear un producto al vuelo solo con «Gestionar productos». Borrador propio en localStorage.
- **El dueño le pone el costo**: franja ámbar en Stock «N entradas esperan su costo» → Recepciones filtradas («Solo sin costo»), chip «falta el costo» en la lista y, en el detalle, «Ponerle el costo» (`ReceiptCostPanel`: costo por producto precargado con su precio de compra, total autocalculado y editable, contado/crédito, factura con el chequeo de repetidas) → `POST /api/receipts/{id}/cost`. Sin costo no se puede «Devolver productos». Aviso nuevo `RECEIPT_COST_PENDING` en la campana («Falta el costo»), que abre esa recepción (`/stock?tab=receipts&receipt=<id>`).
- **El vendedor no ve un solo importe en Recepciones**: sin columna Total ni Modalidad (ahora «Estado»), sin filtro de contado/crédito, sin P. unit./Subtotal ni total en el detalle. El API ya no se los manda (antes los veía en la web: «Casco · S/ 15»).
- Empleados: la ayuda de permisos explica la entrada simple. Textos es/en/it.

## 1.18.0 — 2026-10-23 (avisos al teléfono; sube junto al API 1.11.0)
- **El tiempo real va con sesión**: el API ya no deja escuchar el WebSocket sin token. `wsClient` manda `Authorization: Bearer` en el CONNECT de STOMP (lo lee de localStorage en cada reconexión) y `useBusinessSocket` reconecta en cuanto hay token nuevo (renovado en `api.js`, login o cambio de negocio, evento `eazystock:token`); si el API responde «SESSION_EXPIRED» al conectar, fuerza la renovación. **Sin esta versión la web pierde las ventas en vivo con el API 1.11.0.**
- **Token caducado → 401**: el API responde ahora 401 `{code: SESSION_EXPIRED}` (antes 403 vacío, y la web no renovaba la sesión: «Error al guardar» hasta recargar). `api.js` ya renovaba con 401; no hizo falta tocar la lógica.
- **Avisos nuevos en la campana y en Notificaciones**: «Stock bajo» (icono rojo, cuando un movimiento deja el producto bajo su mínimo) y «Por vencer» (morado, 9:00 del negocio: vence hoy, mañana o en 7 días). Título y cuerpo traducidos es/en/it.
- **Tocar un aviso abre su sitio**: venta → su detalle (`/sales?sale=<id>`), nuevo stock → movimientos del producto, stock bajo → ficha del producto (dueño) o Inventario › stock bajo, por vencer → ficha del producto o Reportes › Por vencer. Los avisos viejos sin `entityId` abren la lista. Productos abre `?edit=` también si ya estabas en la página.

## 1.17.0 — 2026-10-22 (listo para cobrar: cuentas y legales; task 1112)
- **¿Olvidaste tu contraseña?** en el login → `/olvide` (mensaje neutro) → correo → `/restablecer?token=` (nueva contraseña ×2 con ojito). Alias /forgot y /reset.
- **Confirma tu correo**: `/verificar?token=` y franja discreta en la app («Confirma tu correo… · Reenviar», se cierra por sesión) para cuentas sin verificar. Pagar con tarjeta exige el correo confirmado.
- **Términos y condiciones** en `/terminos` (alias /terms, /agb, /condiciones), español vinculante + inglés y alemán: renovación, cancelación, reembolsos, solo lectura al vencer, promo y fundadores, cobro el 15, sin factura SUNAT, borrado por correo, ley alemana. Prerenderizada y en el sitemap.
- **Privacidad**: sección «Pagos (Stripe)» en alemán, español e inglés; actualizada al 22-oct-2026.
- Enlace «Términos» en el pie de la landing, del registro y de Impressum/Privacidad; en el registro, «Al crear la cuenta aceptas los Términos y la Política de privacidad».

## 1.16.3 — 2026-10-21 (dark mode con contraste de verdad; Frank, task 1094)
- **Divisores**: en oscuro las líneas de TODAS las listas («Pide tu atención», «Stock bajo», movimientos, notificaciones, fondo de caja…) se quedaban casi blancas (#f3f4f6). Causa: el selector que genera Tailwind para `divide-*` (`> :not([hidden]) ~ :not([hidden])`) pesa más que el override viejo (`> * + *`), que nunca ganaba; `divide-gray-50` ni estaba mapeado. Ahora van en #374151 / #4B5563.
- **Caja «Debe haber en el cajón ahora»** (Dashboard): el fondo `bg-emerald-50/70` no tenía regla en oscuro → verde pastel con texto claro encima, invisible. Mapeadas todas las variantes con opacidad que faltaban (`bg-emerald-50/60|70`, `bg-amber-50/60`, `bg-orange-50/70`, `bg-gray-50/40|80`, `bg-gray-200/70`, `text-emerald-700/70`, `text-blue-700/70`).
- **Precio variable en Nueva venta**: la línea del carrito con precio por definir (`bg-orange-50/70` + `border-orange-300`) quedaba clara en oscuro → naranja oscuro translúcido con borde a juego. Bordes/rings 300 de «seleccionado» (`border-blue-300`, `border-emerald-300`, `ring-blue-300/60`, `ring-slate-200`) también.
- **Hover/focus**: `hover:bg-gray-200`, `hover:bg-blue-200`, `focus:bg-white`, `hover:text-gray-700`… ponían texto oscuro sobre oscuro o un parpadeo blanco al pasar el mouse. Mapeados todos.
- Auditoría automática de clases claras sin regla oscura: 0 pendientes.

## 1.16.2 — 2026-10-20
- La tarjeta de precios (con la cuenta regresiva) vuelve a la malla sola, sin corrientes (Frank).

## 1.16.1 — 2026-10-20
- Pie sin las corrientes (Frank: «too much, antes estaba bien»).

## 1.16.0 — 2026-10-20 (navbar con submenús, «Un día» en línea de tiempo, paso 2 concreto, cuenta regresiva, corrientes en todo lo oscuro; Frank, task 1042)
- **Navbar**: píldora con las páginas y **«Inicio» y «Funciones» despliegan un panel** (icono + nombre + una línea) con las secciones de cada página (Inicio: rubros, beneficios, un día, cómo empezar, de dónde sale, precios; Funciones: vender, caja, fiado, pedidos, importar, todas). Se abre al pasar el mouse o con un clic, se cierra con Escape, al navegar o al salir; en el celular, acordeón. «Probar gratis» en 3D. Anclas nuevas `#rubros`, `#un-dia`, `#precios`.
- **«Un día con Eazy Stock»**: sección oscura con **línea de tiempo del día** (8:00 vende · 12:30 fiado · 17:00 pedido · 20:00 cierre): el punto recorre las horas y la ficha de ese momento se enciende; con el mouse manda la señalada. Iconos **centrados** en baldosa clara.
- **«Cómo empezar»**: tres tarjetas con iconos propios centrados (fuera los degradados) y textos en cristiano («Pones el nombre de tu tienda y listo…»). **Paso 2 concreto**: «Trae tu lista de productos, como la tengas» + banda «Como la tengas» con Excel/CSV · Word/PDF · Foto del cuaderno · Por WhatsApp, «si no es Excel lo cargamos nosotros en 24–48 h, sin costo» y enlace a /funciones#importar.
- **Precios**: **cuenta regresiva** de lo gratis (días · horas · min · seg hasta la medianoche de Lima del 15-dic); desaparece sola al terminar la promo.
- **Corrientes del fondo** (`HeroBackdrop` con `id` y `paths`; trazados en `landing/streams.js`): en el CTA final pasan **por detrás de los botones**, no del texto (`STREAMS_CTA`); y van por los bordes (`STREAMS_EDGES`) en todas las zonas oscuras: «Un día», tarjeta de precios, pie, «Para quién», franja de Beneficios y cabecera de las páginas interiores.
- Diccionario `landing6.js` (en/it).

## 1.15.1 — 2026-10-20 (retoques de Frank)
- Carrusel: fichas más chicas (`clamp(260px, min(48vh, 80vw), 480px)` de alto) y fuera el chip «Aquí nació Eazy Stock».
- Beneficios: hoja de cuaderno sobria y más real (papel casi blanco con rayas grises, grano leve y sombra del lomo; sin margen rojo ni sello), los iconos van **sin baldosa** en las dos caras (azul noche sobre el papel, azul claro sobre la ficha), y la ficha de la app es un azul noche **un punto más claro con luz arriba y bisel** (`.lp-appcard`).
- Textos: la frase de la ferretería se dice una sola vez (en «De dónde sale»); «Para todo tipo de negocio» ahora dice «Vendas lo que vendas: aquí entra tu mercadería, salen tus ventas y queda claro cuánto ganas. Desde el primer día.» y Beneficios «Caja que cuadra, fiado que se cobra y stock que no se acaba. Así se nota Eazy Stock en el día a día.» (fuera «No es una lista de botones…»).

## 1.15.0 — 2026-10-20 (carrusel de borde a borde + Beneficios que giran; Frank, task 1040)
- **«Para todo tipo de negocio» v3**: las fotos ya no van centradas en un contenedor: un **carrusel lento de borde a borde** de la pantalla (Frank: «que las fotos toquen los lados»), que se mueve solo a 26 px/s, **se queda quieto al pasar el mouse o al tocar en el celular** y muestra la frase de la ficha; se puede arrastrar con el mouse o el dedo. El foco sigue pasando ficha por ficha, **sin la barrita de tiempo** (Frank no la quiso). Las 10 fotos (Celulares incluida). `prefers-reduced-motion` → carril nativo sin movimiento.
- **Beneficios con vuelta**: cada beneficio es una **tarjeta que gira en 3D**: por delante, una **hoja de cuaderno** (rayas, margen rojo, letra a mano Caveat autoalojada, sello «ANTES») con el problema; por detrás, la ficha oscura de la app con el icono **centrado**, el chip y lo que hace Eazy Stock. Entra en pantalla con el cuaderno y al segundo y medio **giran solas**; interruptor «Antes | Con Eazy Stock» arriba para girar todas, y clic/Enter en una tarjeta para girar solo esa. Fuera los bloques planos rojo/verde.
- `public/fonts/caveat-latin.woff2` (Google Fonts, autoalojada), `landing5.js` («Toca una tarjeta para darle la vuelta»).

## 1.14.0 — 2026-10-20 («Para todo tipo de negocio» v2: fotos de inventarios por rubro; Frank, task 1040)
- **Texto honesto**: ya no dice que «hoy ordena bodegas, farmacias, librerías…» (hoy solo la usa la ferretería; el marketing recién empieza). Ahora: «Lo construimos dentro de una ferretería de barrio en Perú y está hecho para bodegas, farmacias, librerías y lo que tú vendas».
- **Fuera los iconos simples**: un **mosaico grande** (`landing/BusinessTypes.jsx`, ancho `max-w-7xl`) con una **foto completa por rubro**, generadas con IA (FLUX.1-schnell): solo el inventario de cada negocio, sin personas ni letreros. Ferreterías y Bodegas ocupan el doble (2×2); en tablet dos columnas, en móvil un carril deslizable con fichas de 78 vw.
- **Vivo sin tocarlo**: cada foto respira (Ken Burns lento, 18 s, alternado), un foco recorre las fichas cada 2,6 s mostrando la frase de cada rubro (solo mientras la sección está en pantalla) y la barrita azul marca el tiempo; al pasar el mouse, la ficha en foco es la tuya. `prefers-reduced-motion` lo apaga. Chip «Aquí nació Eazy Stock» en Ferreterías.
- Frases por rubro con solo funciones reales (decimales, vencimiento, códigos, fiado, cierre de caja, cotización por WhatsApp, foto por producto). Se mantiene «¿Tu rubro no está?…».
- Fotos autoalojadas en `public/business/*.webp` (800×1000, ~150 KB cada una, `loading="lazy"` salvo las tres primeras). Diccionario `landing5.js` (en/it); fuera la frase vieja de `landing4.js`.

## 1.13.0 — 2026-10-20 (landing v2: iconos propios, para todo tipo de negocio, fondo liviano; Frank, task 1017)
- **Fuera la sección de números** («7 reportes · 14 permisos · 3 idiomas · 6 decimales»: no le decían nada a nadie y sonaban a ferretería). En su lugar, **«Para todo tipo de negocio»**: diez rubros con icono propio (ferreterías, bodegas, farmacias, abarrotes, librerías, repuestos, ropa, veterinarias, cafeterías, celulares) y «si anotas en un cuaderno, también es para ti».
- **Iconos propios de Eazy Stock** (`landing/icons.jsx`): un solo trazo redondeado y un punto de acento azul, siempre dentro de la baldosa azul noche `IconTile`. Reemplazan los cuadrados con degradado de colores en Beneficios, «Un día con Eazy Stock», Para quién y los rubros. El chip «Hasta 6 decimales» pasa a «Se corrige al vender».
- **Fondo del hero mucho más liviano** (iba lentísimo en PCs con muchas pestañas): las tres manchas `blur-[160px]` pasan a un solo div con degradados radiales, las corrientes ya no usan `feGaussianBlur` (el brillo es un segundo trazo ancho y tenue) y hay 6 partículas en vez de 9. Mismo aspecto.
- Diccionario `landing4.js` (en/it).
- **Regla post-promo** (task 1018): tras el 15 de diciembre la web dice «1 mes gratis, sin tarjeta» y «el segundo mes a mitad de precio» (FAQ, ofertas, registro, login, precios y SEO); durante la promo no cambia nada. Constantes `TRIAL_DAYS = 30`, `AFTER_PROMO_DISCOUNT_PERCENT/MONTHS` en `plans.js`, `afterPromoLine()`, diccionario `promo2.js` (en/it). Arreglados el subtítulo de #precios y la meta de /planes, que seguían diciendo «gratis hasta el 15-dic» sin rama post-promo.

## 1.12.2 — 2026-10-20
- /planes: la tabla comparativa se mostraba con scroll interno y las últimas filas escondidas (la regla global de cabecera fija para las tablas de la app le ponía tope de alto). Clase `lp-table` sin tope.

## 1.12.1 — 2026-10-20 (planes definidos; Frank, task 1016)
- **Pro = hasta 3 negocios y 20 trabajadores** (ya no «ilimitados»); AI sigue sin límite. Textos de /planes, Inicio, Ajustes, Mis negocios, FAQ y JSON-LD al día.
- **Funciones por plan, con «Pronto» en lo que no está** (`PLANS[].features` acepta `{ text, soon }`; `COMPARE` acepta `'soon'` y `{ text, soon }`; chip `SoonMini`): apps Android/iOS (todos), boleta y factura electrónica SUNAT (Pro y AI), IA de prueba en Basic y Pro (10 ventas por voz al mes + 1 consejo de oferta por semana), y en AI ventas por voz sin límite, «pregúntale a tu negocio», consejos de ofertas diarios, promociones por WhatsApp y análisis. Diccionario `plans2.js` (en/it).

## 1.12.0 — 2026-10-20 (onboarding del catálogo + precios nuevos y períodos; tasks 1014/1015)
- **Crear producto al vuelo desde Nueva venta** (Frank, 20-oct, task 1014): si la búsqueda no encuentra nada, botón «Crear «…» y vender ahora»; si se escanea un código desconocido, se abre el mismo modal con el código ya puesto (`components/products/QuickProductModal.jsx`: nombre, precio, unidad). Se crea de verdad (`POST /products/quick`), entra al carrito y se cobra aunque no tenga stock (queda negativo). La tarjeta lo muestra con la etiqueta ámbar «Por completar»; las validaciones de cantidad no lo topan al stock.
- **Productos**: atajo «Por completar» (`?quick=1` desde el Dashboard) y etiqueta en cada fila; al editarlo deja de estar marcado.
- **Dashboard**: «Pide tu atención» suma «productos por completar» y, si el catálogo está vacío, la franja «Carga tu catálogo, o empieza vendiendo» lleva a la bienvenida.
- **Precios nuevos** (Frank, 20-oct, task 1015): Basic S/ 36 · Pro S/ 79 · AI S/ 139 al mes; fuera de Perú US$ 9.90 · 22.90 · 39.90. Soles si el navegador está en español (Perú o sin región), dólares en el resto (`siteCurrency()`); en la app, por el país del negocio. `landing/plans.js` guarda los totales por período en `prices.PEN/USD` (tabla de Frank) con `periodPrice`, `perMonth`, `savings`, `fmtMoney`.
- **Tres períodos con selector** (Mensual · Trimestral −10 % · Anual −20 %) en /planes, en Precios del Inicio y en Ajustes › Tu plan: cada tarjeta muestra el precio por mes, el total de una vez y el ahorro frente al mensual. Desaparece el «año = 10 meses». Ajustes › Tu plan paga con tarjeta mensual, trimestral o anual con el total en el botón y la moneda del negocio.
- **Plan AI «Llega pronto»**: chip y botón apagado en las tres pantallas; sus funciones siguen listadas; FAQ nueva. JSON-LD con los planes. Diccionario `pricing2.js` (en/it).
- **/bienvenida** (`pages/WelcomePage.jsx`), a donde cae toda cuenta recién registrada: tres puertas — Sube tu Excel o CSV (importador), Lo cargamos nosotros (WhatsApp con mensaje prellenado con nombre y negocio, o correo) y Empieza vendiendo (Nueva venta); nota «Pronto: foto del cuaderno o PDF con IA». Textos es/en/it en `dict/onboarding.js`.

## 1.11.5 — 2026-10-20 (corrientes también en el celular; Frank)
- `Streams` es ahora un componente con `paths`/`viewBox`; en el celular se pinta una versión vertical propia (`STREAMS_MOBILE`, lienzo 390×1150) con tres corrientes por las franjas libres del texto, más finas (1.25) y con menos brillo, al 80 %. El texto sigue legible (comprobado a 390 y 430).

## 1.11.4 — 2026-10-20 (hero cerrado: corrientes completas, botones 3D, fondo también en el CTA final; Frank)
- **Tres corrientes con inicio y fin**: nacen fuera del borde izquierdo, cruzan todo el ancho y mueren fuera del derecho, esfumándose en ambos extremos (degradado en `userSpaceOnUse`). Ya no «se quedan a la mitad». Siguen solo en escritorio.
- **Botones con cuerpo 3D** (`.lp-btn-3d` azul con luz arriba, bisel y base de sombra; `.lp-btn-3d-ghost` oscuro); al pasar se levantan, al pulsar se hunden. En el hero y en el CTA final.
- **Sección final antes del pie** con el mismo `HeroBackdrop` (malla + esfumaturas + corrientes), sin los anillos que latían ni los orbes de colores; botones 3D.

## 1.11.3 — 2026-10-20 (hero: móvil legible, animación más grande, fondo simple; Frank)
- **Celular**: las corrientes del fondo pasaban por detrás del texto y no dejaban leer → el SVG solo se pinta desde lg; en el celular quedan la malla y las esfumaturas.
- **Animación más grande en escritorio**: columnas 42 / 58 (ya no 50/50), contenedor hasta 96 rem y la ventana del producto crece hasta 1.3× (antes tope 1×): ~715 px a 1440, ~800 px a 1920. Titular sigue en 3 líneas (`min(3.6rem, 2.5vw)`).
- **Fondo v4, simple** («muy cargado, los círculos no me gustan, la malla me gustaba, esfumaturas»): vuelve la malla con esfumatura más amplia, tres manchas de color difuminadas (azul arriba a la derecha, índigo abajo a la izquierda, celeste al centro) y solo dos corrientes curvas que entran desde el borde izquierdo hacia la ventana con 6 puntos viajando. Sin anillos. Quedó pensado para reutilizarlo en todas las webs.

## 1.11.2 — 2026-10-20 (hero: aire y fondo abstracto, Frank)
- Más espacio entre el texto y la animación (`lg:gap-16 xl:gap-24`, columnas 46/48); el titular sigue en 3 líneas (`min(3.6rem, 2.7vw)`).
- Fondo SVG v3, **abstracto**: fuera la línea con ángulos de 90° y las cajas isométricas («¿qué es eso?»). Ahora son corrientes curvas que nacen fuera del borde izquierdo, fluyen hacia la ventana del producto (todo converge en un solo lugar que lo gestiona) y salen por la derecha, con puntos que viajan por ellas (`animateMotion` + `mpath`) = los productos vendiéndose; degradado por corriente, brillo y el halo de anillos con satélites. Con `prefers-reduced-motion` las corrientes salen dibujadas y sin partículas.

## 1.11.1 — 2026-10-20 (retoques del hero, Frank)
- Bajada: «…cobra el fiado, te muestra qué se vende, y mucho más.» (es/en/it).
- Titular en **tres líneas máximo** en escritorio: cada línea no se parte (`whitespace-nowrap` desde lg) y el tamaño va con el ancho (`min(3.6rem, 2.95vw)`); columnas 50/50. Comprobado en ES y EN a 1280, 1440 y 1920.
- Fondo SVG **visible de verdad** («no lo veo para nada»): anillos como halo alrededor de la ventana del producto con satélites que orbitan, brillo (`feGaussianBlur`), línea de ventas que sube por encima del titular con sus puntos, estantes isométricos en las esquinas libres; trazo más grueso y claro, sin la cuadrícula encima.

## 1.11.0 — 2026-10-20 (hero nuevo de la landing, Frank 20-oct; task 1011)
- **Hero a pantalla completa** (`min-h-[100svh]`): al entrar no se ve nada de la sección siguiente. Titular nuevo «Tu negocio, bajo control. Gestiona, automatiza y vende más.» y bajada que vende más ventas, no solo orden (lo que antes vivía en el cuaderno ahora trabaja para ti… y crece junto con tu negocio). Píldora con la promo (gratis hasta el 15 de diciembre). Debajo del CTA, lo que viene: IA integrada pronto, apps Android/iOS ya casi, reportes que te dicen qué vender más, sin tarjeta + te ayudamos a cargar tus productos.
- **Tour animado del producto en bucle de 12 s** (`landing/HeroTour.jsx`) en vez de la captura estática: el cursor recorre el Dashboard (ingresos de hoy, pide tu atención), abre Ventas › Nueva Venta en el **menú real** de la app (mismos grupos y estilos que `layouts/Sidebar.jsx`), escanea tres productos, cobra con Yape y luego abre Reportes › Balance (cierre de caja por medio + ganancia del mes). Las fichas flotantes cambian según la pantalla y solo aparecen cuando hay algo que decir (entrada/salida suave). El cursor se posiciona midiendo el DOM (`data-tour`), así no se desalinea. Se escala al ancho disponible (ResizeObserver), solo corre cuando se ve, y con `prefers-reduced-motion` (y en el prerender) se queda quieto en el Dashboard.
- **Fuente nueva: Inter Tight** (autoalojada, OFL) en los titulares de toda la web pública; fuera Bricolage Grotesque (Frank: «no me gusta para nada; la de los negocios fancy, tipo Arial pero más alta y con menos curvas»). Mismo tipo que la web de la E.L.C.
- **Colores sobrios**: fuera el degradado celeste/verde/ámbar de los titulares («parecía infantil»); blanco + gris + un solo azul. `GlowOrbs` queda en azul (afecta también a las cabeceras de /funciones, /para-quien, /planes y /preguntas). El CTA final también sin degradado.
- **Fondo del hero con SVG animado** (`HeroBackdrop`, como en Eazy Finance y Eazy Habit): anillos punteados que giran despacio, estantes isométricos que se dibujan solos y una línea de ventas que sube, en una sola tinta.
- Lo que viene (/preguntas): «Apps para Android e iOS» pasa a **Ya casi**; «Inteligencia artificial» pasa a **IA integrada · Pronto**. OG/Twitter title con el claim nuevo. Traducciones en/it en `dict/hero.js`. Se borra el `AppMockup` viejo y las fuentes Bricolage.

## 1.10.1 — 2026-10-19
- Ajustes › Tu plan: el precio con decimales se muestra tal cual (S/ 19.50, no «S/ 20»). /planes: sin el «sin tarjeta» repetido bajo el selector mensual/anual.

## 1.10.0 — 2026-10-19 (promo de lanzamiento, RUC obligatorio, cobro el 15; tasks 1001-1003)
- **Gratis hasta el 15 de diciembre, sin tarjeta** en toda la web pública (Inicio, /planes, login y registro) y en la app: `plans.js` tiene `PROMO_FREE_UNTIL`, `FOUNDERS_LIMIT`, `BILLING_DAY`, `promoActive()`, `promoVars()` y `trialLine()`; cuando pase la fecha, los textos vuelven solos a «14 días gratis». La oferta «{pct} % de descuento» pasa a ser «Los primeros 50 negocios pagan la mitad 6 meses» y la FAQ explica hasta cuándo es gratis, qué ganan los primeros 50 y que se cobra el 15 de cada mes.
- **Registro con RUC obligatorio**: campo «RUC» (o la identificación fiscal del país: CUIT, RUT, NIT, RFC…) con validación en el navegador (`utils/taxIds.js`, mismo algoritmo SUNAT del BE) y errores del BE bajo el campo (inválido, repetido → «Inicia sesión»). El panel izquierdo muestra si aún hay lugar entre los primeros 50 (GET /api/plans, `foundersAvailable`), nunca la posición.
- **Ajustes › Tu plan**: tarjeta «Primeros 50: Sí / No» (fundador: mitad de precio 6 meses y precio bloqueado); la prueba dice «Gratis hasta»; el pago con tarjeta explica que el primer cobro es el 15 tras el período gratis y luego cada 15. Banner: «Gratis hasta el {fecha}: te quedan {n} días» cuando la prueba es larga.
- **Boss › Suscripciones**: chip «Fundador» y casilla para marcarlo o quitarlo.
- Traducciones en/it en `dict/promo.js`.

## 1.9.0 — 2026-10-19 (nota de pedido, pedido de William; task 989)
- **Nota de pedido desde el detalle de una venta.** Para el cliente que compró pero no quiere factura: en «Detalle de venta» (Ventas, Reportes y ficha del cliente) el botón «Nota de pedido» abre la botonera Descargar PDF · WhatsApp · Correo · Imprimir. El documento lleva el negocio con su RUC (si lo tiene en Ajustes), quién atendió, el cliente de la venta (con su teléfono y correo si está asociado), la fecha, el número `NP-AAAAMMDD-XXXX` (fecha de la venta + inicio de su id, estable para reimprimir), las líneas con cantidad, precio y subtotal, el subtotal y descuento si lo hubo, el total cobrado y cómo pagó (o «al fiado»). En el celular el PDF va adjunto a la hoja de compartir; en escritorio se descarga y se abre WhatsApp con el mensaje listo.
- Un solo molde para cotización y nota de pedido: `quotePdf.js` (`buildDocPdf` + `DOC_KINDS`), `printQuote.js` (`printDoc`) y `shareQuote.js` (`shareDocWhatsApp/Email`, `docMessage`) aceptan `kind`; `QuoteActions` recibe `kind`. Las cotizaciones siguen igual (mismas funciones exportadas). Línea de RUC también en la cotización cuando el objeto la trae.
- Hook `useMyBusiness` (GET /api/me/business) en `useMyBusinesses.js`. Traducciones en/it en `sales.js`.

## 1.8.0 — 2026-10-16 (antes de ir a por más usuarios: legales, feedback real, importación, landing con personalidad; tasks 934-940)
- **Impressum en tres idiomas** (task 934): `/impressum` ya cambia de idioma como la Datenschutz (pestañas Deutsch / Español / English). El alemán sigue siendo el único texto con valor legal (el que dictó el asesor); español e inglés son traducción de cortesía y lo dicen en un aviso. `LangTabs` y `useLegalLang` compartidos por las dos páginas legales.
- **Fuera el testimonio inventado** (task 935). En su lugar, la sección «De dónde sale» (`OriginStory`, en Inicio y en Para quién): quiénes somos (dos hermanos desde Berlín), dónde se construyó (una ferretería de barrio en Perú) y seis cosas reales que pidió el mostrador y hoy están en la app (fondo de caja, 6 decimales, devolución al proveedor, fusionar repetidos, estado de cuenta por WhatsApp, corregir el precio al vender). WhatsApp y correo directos: «te contestamos nosotros, no un bot».
- **Landing con más personalidad** (task 938, primera pasada): tipografía propia para los titulares de la web pública (Bricolage Grotesque, autoalojada en `public/fonts`, sin Google Fonts por la Datenschutz; clase `.lp-display` en el hero, los `SectionHead`, el `PageHero` y el CTA final). Chip del hero «Nacido en una ferretería de barrio».
- **Importación — «lo cargamos nosotros»** (task 939): la sección de importar de Funciones ofrece mandar fotos del cuaderno o el PDF del proveedor por WhatsApp y que lo dejemos cargado en 24–48 h.
- Diccionario `landing3.js` (en/it) para todo lo nuevo.
- **Ajustes › «Tu opinión»** (task 936, visible para todos los roles, ancla `/settings#feedback`): 5 estrellas, chips Idea / Problema / Me gusta / Otro, mensaje, «Pueden escribirme por WhatsApp sobre esto» y la lista «Lo que ya nos contaste» con estado (Enviado / Leído / Respondido) y la respuesta de Frank resaltada.
- **Boss › Feedback** (`/boss/feedback`): cabecera con nuevos, total y promedio de estrellas, pestañas Nuevos / Todos, tarjetas con el comentario completo, WhatsApp directo al negocio y modal para responder, anotar y asignar recompensa (que se aplica a mano en Boss › Suscripciones). Globito rojo con los comentarios nuevos en el conmutador del panel Boss. Traducciones en `feedback.js`.
- **Importar productos** (tasks 939/940): tarjeta «¿No tienes el inventario en Excel? Lo cargamos nosotros.» con envío por WhatsApp (mensaje prellenado con tu nombre y negocio) o correo; plantilla .csv descargable en tu idioma con dos filas de ejemplo y tres consejos para el primer conteo; al subir el archivo se indica qué hoja se leyó y en qué fila estaban los encabezados. Traducciones en `imports2.js`.

## 1.7.0 — 2026-10-15 (varios negocios por dueño + pago con tarjeta · frontend)
- **Mis negocios** (`/negocios`, solo dueño): la **suma total** de todas tus tiendas por moneda (ventas del período y cuántas, por cobrar, por pagar, stock al costo) con el selector de período de Reportes, y una tarjeta por negocio con sus números, «Estás aquí», **Entrar** (cambia de negocio sin cerrar sesión: tokens nuevos) y **Nuevo negocio** (país → moneda propuesta, WhatsApp); si el plan no admite más (Basic = 1) avisa y lleva a Tu plan. Entrada «Mis negocios» en el menú.
- **Cambiador de negocio** en la barra de arriba: con varios negocios, el nombre se vuelve un botón que lista las tiendas de la cuenta y «+ Nuevo negocio».
- La suscripción pasa a ser **de la cuenta del dueño** (no del negocio): Ajustes › Tu plan muestra «Negocios: n de m (plan)»; Boss › Suscripciones lista una fila por dueño con sus negocios, total de cuentas y de negocios.
- **Pagar con tarjeta (Stripe)** en Ajustes › Tu plan cuando el servidor lo tiene configurado: mensual o anual (10 meses) por plan → Stripe Checkout; con suscripción activa, «Gestionar pago y facturas» (portal). Aviso verde al volver con el pago hecho, gris si se canceló. Sin Stripe, sigue el camino manual por WhatsApp.

## 1.6.0 — 2026-10-15 (planes en serio · frontend)
- **Registro propio** en `/registro` (nombre, correo, contraseña con ojito, negocio, país con moneda propuesta, WhatsApp opcional, aceptación de la privacidad): la cuenta nace con **14 días gratis sin tarjeta** y **50 % de descuento los primeros 6 meses** (lo aplica el BE) y entra directo al panel. Todos los «Probar gratis» de la web pública llevan ahí; «Iniciar sesión» y «Ya tengo cuenta» siguen al login, que ahora dice «¿Aún no tienes cuenta? Crear cuenta gratis».
- Ofertas de /planes y de la landing actualizadas: «14 días gratis, sin tarjeta», «50 % de descuento los primeros 6 meses» y la anual; FAQ de precios y de cómo se paga (manual por WhatsApp hasta la pasarela).
- En la app: **franja de suscripción** bajo la barra (prueba y días que quedan, pago vencido en gracia, vencido = solo lectura; el empleado ve «el dueño debe activar el plan»); **Ajustes › Tu plan** (estado, fechas, precio efectivo con el descuento, las tres tarjetas con la actual marcada y cómo activar por WhatsApp o correo); aviso de **límite del plan** al crear empleados; el 402 del BE (plan no activo) muestra un toast con atajo al plan sin cerrar sesión.
- **Boss › Suscripciones**: todos los negocios con su prueba, plan, estado, precio y nota; «Pagado +1 mes», «Prueba +7 días», WhatsApp al dueño y edición completa (plan, estado, fechas, descuento, precio especial, precio bloqueado, nota). Ingreso mensual comprometido arriba.

## 1.5.0 — 2026-10-15 (legales DE)
- Fabrizio tiene ya su Partita IVA en Berlín: la web cumple la ley alemana antes de meter la pasarela de pagos. Nueva página **/impressum** (§ 5 DDG: Fabrizio Farfan · Eazy Life, Sprengelstraße 7, 13353 Berlin; § 19 UStG sin IVA; § 18 Abs. 2 MStV; sin arbitraje de consumo), en alemán tal cual la dictó el asesor.
- Nueva página **/datenschutz** (DSGVO): responsable, hosting en Contabo (UE), logs, localStorage solo técnico (sin banner de cookies), registro y cuenta, datos del negocio como encargo de tratamiento (art. 28), enlaces de WhatsApp y PDF, sin analítica, pagos (se completará con la pasarela), derechos y autoridad de Berlín. Versión alemana vinculante + español e inglés con pestañas; alias /privacidad, /privacy y /legal.
- Enlaces «Impressum · Privacidad» en el pie de la web pública, en el login y al pie de Ajustes. Prerender y sitemap de las dos páginas.

## 1.4.0 — 2026-10-10 (pedido de William)
- Nueva página **Compras y gastos** (Reportes, solo dueño): cuánto se fue en el período —mercadería recibida de proveedores (las recepciones de Stock, al costo) + otros gastos— por día, semana, mes o año (partición automática o a elección), con comparación contra el período anterior, gráfica apilada, tabla tramo a tramo, ranking «A quién le compraste» y «Otros gastos, por tipo». Arriba también lo pagado de verdad a proveedores y lo que entró al crédito.
- **Registrar gasto**: alquiler, luz/agua/internet, transporte y flete, sueldos, impuestos, mantenimiento, publicidad, útiles y bolsas u otro; cuánto, qué fue, qué día, proveedor y medio de pago opcionales, nota. Se corrigen y se borran desde la misma página. Tutorial propio. es/en/it.

## 1.3.0 — 2026-10-03
- Proveedores: la tarjeta ya no abre nada al tocar el nombre u otra parte; solo «Cuenta y pagos» y «Sus productos» llevan a su página.
- Historial de cobros: filtro por cliente (buscador). Historial de pagos: filtro por proveedor. En Stock › Movimientos, «Pagos a proveedor» respeta el filtro de proveedor de la barra.

## 1.2.0 — 2026-10-03 (pedidos de William)
- Stock › Movimientos muestra también la PLATA que no mueve stock: franja «Cobros de fiado» / «Pagos a proveedor» del período con su total, y filtros propios con la lista (fecha y hora, cliente o proveedor, monto, saldo que quedó, quién lo registró). La franja del día suma «Cobros de fiado» con atajo.
- Cuentas por cobrar y Cuentas por pagar: pestaña «Historial de cobros» / «Historial de pagos» por período (los que ya terminaron de pagar ya no se pierden).
- Login: ojito para ver la contraseña mientras la escribes.
- Proveedores: cada tarjeta con dos acciones claras, «Cuenta y pagos» y «Sus productos»; hover arreglado en modo oscuro.
- Nueva página «Análisis de proveedores» (solo dueño): quién te vende más, de quién tienes más stock (unidades y valor al costo), cuánto vendes de lo suyo y cuánto le debes, con ranking ordenable, período y tutorial.

## 1.1.0 — 2026-10-03
- La versión vive en `package.json` y se muestra en Ajustes, en el pie del menú y en el Panel Boss (junto a la del API).
- Lado Boss con el diseño nuevo: Panel Boss (franja azul con la plataforma entera, actividad por negocio en tarjetas), Negocios y Owners (cabecera, selector entre las tres, franja con cifras, buscador grande y tarjetas con acciones visibles); modales de negocio, owner y usuario sobre `EntityModal`.
- «La ruta a SaaS» horizontal: estaciones con desplazamiento lateral, enfocada en la fase actual (las demás compactas, se tocan para abrirlas); el piloto de la farmacia queda completado pero marcado como fallo.
- El dashboard del admin de plataforma ya no existe como página aparte: `/dashboard` lleva al Panel Boss.

## 1.0.0 — hasta 2026-09-29
- Todo lo anterior, incluido el rediseño completo de las páginas del dueño y del vendedor (sep-2026).
