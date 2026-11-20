# API local de desarrollo

Servidor de prueba para usar el frontend mientras el servidor real no existe (sprint 2).
Los datos viven en `db.json` y se guardan ahí cada vez que alguien cambia algo desde la app (precios, usuarios, cotizaciones, visitas, compras…). Para volver a los datos de demostración, apaga la API y ejecuta `git checkout mock-api/db.json`.

```bash
npm run api   # http://localhost:3000/api/v1   (o npm run dev para encender API + app)
```

## Cuentas de desarrollo

> **Solo para desarrollo.** Estas contraseñas son públicas en el repositorio; el servidor real tendrá sus propias cuentas.

| Usuario | Contraseña | Rol |
| --- | --- | --- |
| `ceo` | `ceo-alpamayo-26` | CEO |
| `vendedora` | `vende-alpamayo-26` | Vendedora |
| `almacen` | `alma-alpamayo-26` | Almacén |

En `db.json` las contraseñas se guardan solo como hash `scrypt` con sal (`passwordHash`), nunca en texto plano, y la API nunca las devuelve.

## Qué simula `server.cjs`

- `POST /api/v1/authentication/sign-in` → `{ token, expiresAt, user }`. 401 si el usuario o la contraseña no coinciden, 403 si la cuenta está desactivada.
- El resto de `/api/v1` exige `Authorization: Bearer <token>` (401 sin token). El token dura 8 horas y vive en memoria: al reiniciar la API hay que volver a iniciar sesión.
- Solo el CEO puede usar `/users` y escribir en `/prices` y `/price-lists` (403 para el resto). Cualquier rol puede crear tipos de vidrio (`POST /glass-types`).
- Productos (`/products`, `/series`): todos los leen y cualquier rol agrega uno **sin precio**; solo el CEO cambia el precio público (`PATCH /products/:id` con `{ publicPrice, changeReason? }`), que queda en `/product-price-history` (solo CEO, no se edita ni borra).
- Inventario (`/sites`, `/inventory-items`, `/stock-levels`, `/stock-movements`): todos los roles. La cantidad solo cambia con `POST /stock-movements` (`{ itemId, siteId, kind: COUNT | ADJUSTMENT, quantity, reason? }`), que devuelve `{ movement, level }`; los movimientos no se editan ni borran. "En camino" y notas: `POST /stock-levels` (crea o actualiza) y `PATCH /stock-levels/:id`.
- Compras (`/purchases`): todos los roles registran una llegada (`POST /purchases` con `{ date, supplier, siteId, notes?, lines: [{ itemId, quantity, packs? }] }`), que suma el stock con un movimiento `PURCHASE` y devuelve `{ purchase, levels }`. Solo el CEO pone los costos (`PUT /purchases/:id/costs` con `{ exchangeRate, freight, transport, unitPricesUsd }`; flete y transporte como `{ amount, currency: PEN | USD }`): la API reparte flete y transporte según el valor y guarda el costo por unidad. A los demás roles **se les quitan todos los montos** de la respuesta. Margen mínimo: `GET/PUT /cost-settings` (solo CEO).
- Cotizaciones (`/quotes`): además de vidrios (`lines`) y conceptos adicionales (`extras`), llevan productos del catálogo (`products`: `productId`, `color`, `saleUnit`, `quantity` entera, `catalogUnitPrice` y `unitPrice` final). La API revisa que el precio de catálogo sea el actual, que los totales cuadren y que ningún precio final (de vidrio o de producto) quede por debajo de la rebaja máxima (`400 discount-too-high`); el CEO no tiene límite. Las cotizaciones guardadas antes no traen `products`.
- Rebaja máxima: `GET /sale-settings` (todos, `{ maxDiscountPercent }`) y `PUT /sale-settings` (solo CEO, de 0 a 100 o `null`). Mientras sea `null`, nadie más que el CEO puede bajar precios.
- El `db.json` del repositorio ya trae los datos de `inventory-seed.json` (sacados de la hoja de inventario de Dylan). Al arrancar, la API los agrega **solo si faltan esas colecciones**: lo escrito desde la app no se pisa. Para recargar la semilla, borra de `db.json` las colecciones `products`, `inventory-items` y `stock-levels` y reinicia.
- Reglas de cuentas: nadie puede desactivarse ni quitarse el rol de CEO a sí mismo, siempre queda al menos un CEO activo, y al desactivar o cambiar la contraseña se cierran las sesiones de ese usuario.

Los datos de catálogo son los de los casos de prueba del Excel (laminado cielo 6 mm a S/ 8.00 y espejo doble 4 mm a S/ 6.50, lista Pública).
El color "plateado" del espejo es provisional: corrígelo desde la app si no corresponde.
