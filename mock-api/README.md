# API local de desarrollo

Servidor de prueba para usar el frontend mientras el servidor real no existe (sprint 2).
Los datos viven en `db.json` y se guardan ahí cuando el CEO cambia precios o crea usuarios desde la app.

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
- Reglas de cuentas: nadie puede desactivarse ni quitarse el rol de CEO a sí mismo, siempre queda al menos un CEO activo, y al desactivar o cambiar la contraseña se cierran las sesiones de ese usuario.

Los datos de catálogo son los de los casos de prueba del Excel (laminado cielo 6 mm a S/ 8.00 y espejo doble 4 mm a S/ 6.50, lista Pública).
El color "plateado" del espejo es provisional: corrígelo desde la app si no corresponde.
