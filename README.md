# Vidriería Alpamayo — Frontend

Cliente web Angular 21 del sistema de gestión de Vidriería Alpamayo, vidriería mayorista en Huaraz, Perú.

## Alcance de la iteración 1

- Inicio de sesión con usuario y contraseña y tres roles: CEO, vendedora y almacén.
- Catálogo de vidrios: lo ven todos; solo el CEO cambia precios.
- Cotizador de vidrios por pie cuadrado, con total al instante.
- Administración de usuarios, solo para el CEO.

Fuera de esta iteración: móvil, aluminios, ventanas por serie, clientes, inventario, facturación y panel de indicadores.

## Reglas del proyecto

1. Los precios nunca se escriben en el código: vienen de la API.
2. Ninguna clave ni dirección de servidor en el código: todo va en `src/environments/`.
3. Cada ruta protegida usa la guardia de IAM y valida el rol.
4. Código en inglés técnico; textos visibles en español mediante `public/i18n/`.
5. Cada tienda y cada regla de cálculo lleva pruebas automáticas.

## Regla de cálculo del cotizador

- Cada medida se redondea hacia arriba al múltiplo de 5 cm.
- Pie cuadrado de una pieza = ancho × alto ÷ 900.
- Total de la línea = pie cuadrado × cantidad × precio por pie cuadrado de la lista elegida (pública o vidriero).
- El IGV está incluido en el total: subtotal sin IGV = total ÷ 1.18.
- Las medidas pueden ingresarse en cm, mm o pulgadas: se convierten a cm antes de redondear (2130 mm → 215 cm; 84" → 215 cm).

## Importar medidas desde Excel

1. En el cotizador, «Descargar plantilla» genera `plantilla-cotizacion-alpamayo.xlsx` con listas desplegables de vidrio (del catálogo actual) y de unidad. No incluye precios.
2. El cliente llena una fila por pieza (Tipo de vidrio, Ancho, Alto, Unidad, Cantidad, Referencia) y la devuelve.
3. «Importar Excel» muestra una vista previa: filas listas con su total y filas con errores (n.° de fila y motivo). Al confirmar, reemplaza las líneas de la cotización.

El lector también acepta Excel propios del cliente si tienen columnas reconocibles («Vidrio», «Ancho», «Alto», «Cant.»…), aunque estén en otro orden o tengan filas de título arriba.

Casos de prueba de referencia:

| Caso | Medidas | Cantidad | Precio | Resultado |
| --- | --- | --- | --- | --- |
| Laminado cielo 6 mm, lista pública | 213 × 123 cm → 215 × 125 | 2 | S/ 8.00 | 59.72 pie² · S/ 477.78 |
| Espejo doble 4 mm | 120 × 60 cm | 1 | S/ 6.50 | 8 pie² · S/ 52.00 |

## Estructura

Cada dominio en `src/app` tiene cuatro capas: `domain`, `application`, `infrastructure` y `presentation`.

| Carpeta | Contenido |
| --- | --- |
| `shared` | Base de API, ensamblador, entidad base, layout, configuración de idioma, componentes comunes |
| `iam` | Inicio de sesión, guardia de rutas e interceptor del token |
| `catalog` | Tipos de vidrio (nombre, espesor, color), listas de precio y precio por pie² que fija el CEO |
| `quoting` | Regla de cálculo (`domain/services/square-foot-calculator.ts`) y cotizador |

## Desarrollo

```bash
npm ci          # instala dependencias exactas del lockfile
npm run dev     # enciende la API de prueba y la app juntas → abre http://localhost:4200
npm run api     # solo la API local de prueba (http://localhost:3000/api/v1, ver mock-api/README.md)
npm start       # solo la app (http://localhost:4200)
npm test        # pruebas unitarias (Vitest)
npm run build   # build de producción en dist/alpamayo
```

Con `npm run dev`, al cerrar la terminal (Ctrl+C) se apagan las dos partes. Si aparece "port already in use", ya hay otra copia encendida: abre http://localhost:4200 o ciérrala antes.

La API se configura en `src/environments/environment*.ts` (`apiBaseUrl`). En desarrollo apunta a json-server (`npm run api`); si está apagado, las pantallas muestran un error controlado, nunca datos inventados.

## Rutas

| Ruta | Pantalla |
| --- | --- |
| `/iniciar-sesion` | Inicio de sesión |
| `/cotizador` | Cotizador por pie² con la lista de precio elegida |
| `/catalogo` | Catálogo de vidrios y precios (solo lectura) |
| `/catalogo/precios` | Precios por pie², nuevos vidrios y nuevas listas (CEO) |
| `/configuracion` | Idioma de la interfaz |
