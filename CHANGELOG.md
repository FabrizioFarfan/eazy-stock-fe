# Changelog — Eazy Stock (app web)

Versionado semántico desde el 3-oct-2026 (regla de Frank: cada tanda desplegada sube la versión y la app la muestra).

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
