# Changelog — Eazy Stock (app web)

Versionado semántico desde el 3-oct-2026 (regla de Frank: cada tanda desplegada sube la versión y la app la muestra).

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
