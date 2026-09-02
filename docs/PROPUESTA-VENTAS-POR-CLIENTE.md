# Propuesta: ventas asociadas a un cliente (opcional)

_Estudio para proponérselo a William — 2 de septiembre de 2026. Nada de esto está implementado; es el plan._

## La idea en una frase

Que cualquier venta (no solo la de fiado) pueda llevar un cliente, sin obligar a nadie: el cajero
vende igual de rápido, pero cuando el cliente es conocido lo toca en un botón y desde ese momento
el negocio sabe **quién compra, qué compra, cuánto y cuándo fue la última vez**.

## Qué gana William

| Pregunta que hoy no puede responder | Con ventas por cliente |
|---|---|
| ¿Quiénes son mis mejores clientes? | Ranking por monto y por número de compras, en el periodo que elija. |
| ¿Qué le vendo a cada uno? | Productos más comprados por cliente, con cantidades y última fecha. |
| ¿Cuándo fue la última vez que vino fulano? | «Última compra» en la ficha y una lista de **clientes que no compran hace X días** para llamarlos o mandarles un WhatsApp. |
| ¿Cuánto gasta en promedio? | Ticket promedio y frecuencia (compras por mes). |
| ¿Qué pasó con este cliente? | En su ficha, en un solo lugar: compras al contado, fiados, abonos y cotizaciones. |
| ¿A quién le mando la promoción del cemento? | A los que lo compraron en los últimos 6 meses (filtro por producto). |

Efecto secundario útil: la ficha del cliente deja de ser «solo para el fiado» y pasa a ser la memoria
comercial del negocio. Y con los teléfonos con prefijo (ya hecho) el WhatsApp sale directo.

## Cómo funcionaría (UX)

1. **Nueva venta**: debajo del carrito, una línea «Cliente (opcional) · Asociar cliente». Abre el
   mismo modal que ya usa el fiado (lista completa, búsqueda, filtros, registrar nuevo con aviso de
   duplicados). Si el cajero no toca nada, la venta se registra como hoy.
2. Si se activa «Vender al fiado», el cliente es el mismo (no se pregunta dos veces).
3. En el resumen y el ticket aparece «Cliente: Juan Pérez». En la tabla de Ventas, una columna
   «Cliente» y un filtro por cliente.
4. **Ficha del cliente**: pestaña «Compras» (todas sus ventas, contado y fiado) y cuatro números
   arriba: total comprado, n.º de compras, ticket promedio, última compra. Debajo, «Lo que más
   compra».
5. **Reportes › Clientes** (nuevo): ranking del periodo (monto, compras, ticket), y el bloque
   «Sin comprar hace más de 30 / 60 / 90 días» con botón de WhatsApp.
6. Regla que se puede activar después por negocio: «pedir cliente en toda venta» (para negocios
   mayoristas). Por defecto, apagada.

## Estructura de datos (lo bueno: casi está)

- `sales.customer_id` **ya existe** (nullable) porque lo usa el fiado. Se reutiliza tal cual: una
  venta al contado con cliente es una fila con `customer_id` lleno y `is_on_credit = false`.
  **No hace falta migración de datos.**
- Migración pequeña: índice `(business_id, customer_id, created_at)` en `sales` para que las
  consultas por cliente y el ranking sean instantáneos.
- Todo lo demás se **calcula** desde `sales` y `sale_items`; no se duplica ningún dato en la ficha
  del cliente (nada que se desincronice).

## API (BE)

| Endpoint | Para qué |
|---|---|
| `POST /api/sales` acepta `customerId` sin `onCredit` | asociar el cliente a una venta al contado (hoy solo se acepta con fiado). |
| `GET /api/customers/{id}/sales?from&to&page` | pestaña «Compras» de la ficha. |
| `GET /api/customers/{id}/summary?from&to` | total, n.º compras, ticket promedio, última compra, top 5 productos. |
| `GET /api/reports/customers?from&to&sort=amount\|count` | ranking del periodo (Reportes › Clientes). |
| `GET /api/reports/customers/inactive?days=30` | clientes con compras previas y sin comprar hace N días. |
| `GET /api/sales?customerId=` | filtro por cliente en la tabla de Ventas (se añade a los filtros que ya tiene). |

Permisos: ver la ficha y los reportes de clientes cae bajo `canManageCustomers` / `canViewReports`,
que ya existen. Asociar cliente a una venta no necesita permiso nuevo.

## Fases (cada una es una tanda, se puede parar en cualquiera)

1. **Base** — cliente opcional en la venta + columna y filtro en Ventas + índice. Desde el día uno
   se empiezan a acumular datos aunque los reportes vengan después.
2. **Ficha** — pestaña «Compras» y los cuatro números + «lo que más compra».
3. **Reportes** — ranking de clientes y lista de inactivos con WhatsApp; exportar a Excel.
4. (Opcional) fidelización: descuentos por cliente, notas del vendedor, cumpleaños.

## Riesgos y cómo se evitan

- **Que frene la caja**: por eso es opcional y es un solo botón con la lista completa y los recientes
  arriba. Si William quiere obligarlo, es un interruptor por negocio (fase 1, apagado).
- **Clientes duplicados** (lo que pasó con su vendedor nuevo): el modal ya lista a todos y el
  formulario avisa «¿es alguno de estos?» antes de crear otro.
- **Datos viejos**: las ventas anteriores no tienen cliente; los reportes cuentan desde que se
  empiece a usar. Se puede asociar cliente a una venta pasada desde su detalle (fase 2).

## Preguntas para William

1. ¿Le sirve más el ranking por **monto** o por **frecuencia**? (se pueden ver los dos).
2. ¿Quiere que el **DNI del cliente salga en el ticket** de venta?
3. ¿Hay vendedores a los que les pediría **siempre** el cliente (mayoristas) y otros no?
4. ¿Le interesa mandar promociones por WhatsApp a los que compraron cierto producto?
