# Prompt para Claude Code: frontend Angular de Vidriería Alpamayo

Este documento tiene el prompt listo para pegar en Claude Code, más la estructura de carpetas objetivo y las skills recomendadas. Parte de la revisión crítica del frontend que Dylan ya tenía.

## Veredicto de la revisión

| Qué | Decisión |
| --- | --- |
| Estructura por dominios con capas | Conservar |
| Carpeta shared con base de API, ensamblador y respuesta | Conservar y adaptar |
| Estilo visual y componentes de diseño | Usar solo como referencia |
| Módulo iam de la plantilla de cursos | Reescribir con los tres roles |
| Datos mock, precios fijos y cotizaciones de ejemplo | Borrar |
| README, nombre del paquete y variables de entorno de learning-center | Reescribir |
| Módulos de taller, caja, agenda y seguimiento de pedidos | Sacar de esta iteración |
| Pantallas duplicadas de ventas directas | Dejar una sola |

## Estructura de carpetas objetivo

Cada dominio tiene cuatro capas: dominio, aplicación, infraestructura y presentación. Todo en español de negocio para las rutas, y en inglés técnico para el código, sin mezclar.

| Carpeta | Contenido | Iteración |
| --- | --- | --- |
| src/app/shared | Base de API, ensamblador, entidad base, layout, componentes comunes, interceptor de errores | 1 |
| src/app/iam | Inicio de sesión, usuarios, roles CEO, vendedora y almacén, guardia de rutas e interceptor del token | 1 |
| src/app/catalog | Tipos de vidrio, listas de precio, precios y su historial; el CEO edita, los demás ven | 1 |
| src/app/quoting | Cotizador de vidrios con pie cuadrado, líneas, subtotal, IGV y total; cotizaciones guardadas | 1 |
| src/app/customers | Clientes y proyectos | Después |
| src/app/inventory | Stock por sede y conteo | Después |
| src/app/billing | Comprobantes, pagos y facturación | Después |
| src/app/dashboard | Panel del CEO y metas | Después |

Dentro de cada dominio: domain/model, application con las tiendas, infrastructure con la API y los ensambladores, y presentation con views y components.

## Skills recomendadas

No hacen falta muchas. Pocas y bien hechas rinden más.

| Skill | Para qué sirve | Qué debe decir |
| --- | --- | --- |
| Convenciones del proyecto | Que Claude Code no se desvíe | Estructura de carpetas, nombres, capas, cómo se crea una pantalla nueva |
| Regla de costeo | Que los números salgan bien | Redondeo de 5 cm, pie cuadrado entre 900, IGV entre 1.18, y los dos casos de prueba del Excel |
| Pruebas | Que nada llegue sin probarse | Pruebas automáticas por tienda y por regla de cálculo, y cómo ejecutarlas |
| Seguridad | Que nada se filtre | Ninguna clave en el código, contraseñas con hash, permisos por rol |

## Prompt para pegar

```markdown
Vas a ayudarme con el frontend Angular de un sistema de gestión para Vidriería Alpamayo, una vidriería mayorista en Huaraz, Perú. Soy Dylan, estudiante, con unas 12 horas libres por semana. Hoy es 18 de noviembre de 2026 y tengo que presentar una demostración el 23 de diciembre.

CONTEXTO
Ya existe un proyecto Angular 21 en la carpeta actual, creado a partir de una plantilla de curso llamada learning-center. Tiene una buena estructura por dominios y capas, pero su contenido es de mentira. Mi revisión crítica concluyó lo siguiente:
- CONSERVAR: la estructura por dominios con las capas domain, application, infrastructure y presentation; la carpeta shared con la base de API, el ensamblador y la entidad base; el uso de signals y tiendas; la carga diferida de rutas; la internacionalización con ngx-translate.
- REESCRIBIR: el módulo iam, porque habla de cursos. Debe tener tres roles: CEO, vendedora y almacén.
- BORRAR: todos los datos mock escritos en las tiendas, los precios fijos, el nombre learning-center en package.json, el README de curso y las variables de entorno de categorías y cursos.
- SACAR de esta iteración: workshop, caja, agenda y seguimiento de pedidos.
- UNIFICAR: hay dos pantallas de ventas directas; debe quedar una sola.

REGLAS QUE NO SE NEGOCIAN
1. Los precios NUNCA se escriben en el código. Vienen de la API.
2. Ninguna clave ni dirección de servidor en el código: todo en los archivos de entorno.
3. El inicio de sesión debe estar ACTIVO. Hoy está comentado en las rutas; cualquiera entra al panel.
4. Cada ruta protegida usa la guardia de iam y valida el rol.
5. Un solo idioma para el código (inglés técnico) y español para los textos que ve el usuario, a través de las traducciones.
6. Cada tienda y cada regla de cálculo lleva pruebas automáticas. Hoy hay una sola prueba, la que genera Angular.
7. Trabajamos UN SPRINT POR VEZ y antes de escribir código me propones el plan y esperas mi aprobación.
8. Si falta una decisión, me preguntas; no la inventas.

LA REGLA DE CÁLCULO (el cotizador)
El cálculo vive en el servidor, no en el frontend. El frontend solo muestra el resultado, pero para vista previa instantánea puede calcular igual con la misma regla:
- Redondear cada medida hacia arriba al múltiplo de 5 cm.
- Pie cuadrado de una pieza = ancho por alto, entre 900.
- Pie cuadrado de la línea = el de una pieza por la cantidad.
- Total de la línea = pie cuadrado de la línea por el precio por pie cuadrado de la lista elegida (público o vidriero).
- El IGV está incluido en el total: subtotal sin IGV = total entre 1.18.
Caso de prueba 1: laminado cielo 6 mm, lista pública a 8 soles por pie cuadrado, 213 por 123 cm, cantidad 2 = medidas 215 por 125, 59.72 pies cuadrados, 477.78 soles.
Caso de prueba 2: espejo doble 4 mm, 120 por 60 cm, cantidad 1, a 6.5 soles = 8 pies cuadrados, 52 soles.

ALCANCE DE LA ITERACIÓN 1 (frontend)
- Inicio de sesión con usuario y contraseña, tres roles.
- Catálogo de vidrios: lo ven todos, solo el CEO cambia precios.
- Cotizador de vidrios con líneas, pie cuadrado y total al instante.
- Administración de usuarios, solo para el CEO.
NO entra: móvil, aluminios, ventanas por serie, clientes, inventario, facturación, panel de indicadores.

TAREA DE HOY
Primero, sin modificar nada, haz esto:
1. Lee la estructura del proyecto y confirma lo que te conté sobre su estado.
2. Dime qué vas a borrar, qué vas a conservar y qué vas a reescribir, en una tabla.
3. Proponme la estructura de carpetas final según los dominios: shared, iam, catalog y quoting.
4. Espera mi aprobación antes de tocar un solo archivo.

Cuando apruebe, limpia la plantilla (nombre del paquete, README, entornos, mocks) y deja el proyecto compilando sin errores.
```

## Antes de pegarlo

| Paso | Qué hacer |
| --- | --- |
| 1 | Abrir el proyecto en WebStorm y ejecutar npm install para confirmar que compila |
| 2 | Guardar este prompt en un archivo de la raíz, por ejemplo docs/prompt-frontend.md |
| 3 | Tener a mano los documentos principal e iteración 1, exportados en Markdown |
| 4 | Hacer un commit antes de que Claude Code toque algo, para poder volver atrás |

## Nota sobre el plazo

El sprint 1 empezó el 17 de noviembre y hoy es 18. Si el servidor todavía no existe, el frontend no tiene a qué conectarse. Lo realista es trabajar en paralelo: Claude Code limpia el frontend esta semana, y el servidor con su API se construye en el sprint 2, que es cuando se conecta.

---

# Lo que se hizo

Registro del trabajo hecho con Claude Code a partir de este prompt, actualizado al 18 de noviembre de 2026. Es solo frontend: el servidor real se construye aparte, y mientras tanto la app trabaja contra un servidor de prueba local (`mock-api/`) que imita la API.

## Estado de las reglas que no se negocian

| Regla | Estado | Dónde se ve |
| --- | --- | --- |
| 1. Los precios no se escriben en el código | Cumplida. Todos vienen de la API; los fija el CEO | `src/app/catalog` |
| 2. Ninguna clave ni dirección de servidor en el código | Cumplida. Todo en los archivos de entorno | `src/environments/environment*.ts` |
| 3. Inicio de sesión activo | Cumplido. Sesión de 8 horas, sin registro público | `src/app/iam` |
| 4. Cada ruta protegida con guardia y rol | Cumplida. Guardia de sesión y guardia de permiso en todas las rutas | `src/app/app.routes.ts`, `iam/domain/model/permission.ts` |
| 5. Código en inglés, textos en español con traducciones | Cumplida. Español e inglés | `public/i18n/es.json`, `en.json` |
| 6. Pruebas en cada tienda y regla de cálculo | Cumplida. 202 pruebas automáticas, todas pasan | `npm test` |
| 7. Un sprint por vez, con plan aprobado | Cumplida | Este registro |
| 8. Preguntar lo que falta, no inventarlo | Cumplida. Las decisiones están abajo | Sección «Decisiones del negocio» |

Del veredicto de la revisión: se borraron los datos de ejemplo, los precios fijos y los módulos fuera de alcance; se reescribieron el README, el nombre del paquete y los entornos; quedó una sola pantalla de ventas; el módulo iam se reescribió con los tres roles. La agenda, que estaba fuera de esta iteración, **se incluyó por decisión de Dylan** (ver sprint 9).

## Sprints realizados

### 1. Limpieza de la plantilla

- Nombre del paquete y herramientas de desarrollo (`npm run dev` enciende la API de prueba y la app juntas).
- Se borraron los módulos de taller, vendedores y ventas de la plantilla, que tenían datos de ejemplo, precios fijos y la pantalla duplicada de ventas directas. También las vistas de inicio, «acerca de» y pie de página, el logo ACME, el registro público y los mensajes de depuración.
- Direcciones de la API pasadas a los archivos de entorno.
- Commits: `00967be`, `aa11eb8`, `62b0b7f`, `e15d93e`, `bee4fc3`.

### 2. Catálogo y cotizador

- Un vidrio es **nombre + espesor + color**. Hay **varias listas de precio** (por ejemplo, Pública y Vidriero) y el **CEO fija el precio por pie²** de cada vidrio en cada lista.
- Catálogo de solo lectura para todos; editor de precios solo para el CEO.
- Cotizador con líneas, pie² y total al instante, usando la lista elegida.
- Commits: `4133bcf`, `b16b3fb`, `474efa9`, `1a28a02`, `f8ad1cc`.

### 3. Regla de costeo

- Fórmula confirmada por Dylan: **((ancho × alto / 900) × precio pie²) × cantidad**, con cada medida redondeada hacia arriba al múltiplo de 5 cm. El IGV está incluido: subtotal = total / 1.18.
- Los dos casos de prueba del prompt están como pruebas automáticas (477.78 y 52.00 soles).
- Código: `src/app/quoting/domain/services/square-foot-calculator.ts`.

### 4. Unidades de medida e importación desde Excel

- Cada línea elige su unidad: **cm, mm o pulgadas**. Todo se convierte a cm antes del redondeo.
- «Descargar plantilla» genera un Excel con listas desplegables de vidrio y unidad (sin precios) para que un cliente de otra ciudad lo llene y lo devuelva.
- «Importar Excel» lee el archivo, muestra una vista previa con los errores fila por fila y pasa las medidas al cotizador.
- Commits: `10e4bbd`, `f8ad1cc`.

### 5. Diseño visual

- Se adaptó el diseño de referencia de Figma sin copiarlo tal cual: tema rojo Alpamayo, tipografía Inter, componentes comunes (`al-card`, `al-btn`, `al-table`, alertas, etiquetas) en `src/styles.css`.
- Menú lateral plegable y página de «no encontrado».
- Aviso cuando la app se abre de forma incorrecta (por ejemplo, desde WebStorm sin `npm start`) y recuperación automática si falla la carga de una página, en lugar de una pantalla en blanco.
- Commits: `d275696`, `1f10f58`, `b164fd4`, `b41c36a`, `a134f2e`, `e13aed6`.

### 6. Inicio de sesión, roles y usuarios

- Tres roles: **CEO**, **Vendedora** y **Almacén**. Vendedora y Almacén tienen los mismos permisos: cotizar, ver el catálogo y **agregar tipos de vidrio**. Solo el CEO **crea cuentas** y **cambia precios**.
- La sesión dura **8 horas** y sobrevive a recargar la página.
- Pantalla de usuarios para el CEO: crear, cambiar rol, desactivar y restablecer contraseña.
- El servidor de prueba guarda las contraseñas con hash (scrypt con sal) y controla los permisos por rol.
- Commits: `2dbec1d`, `c21b866`, `ba22a97`, `4c865d3`, `53c3394`, `d0afb5f`, `c4aa115`, `9601519`, `4527d94`, `14cfc30`.

### 7. Cotizaciones guardadas e impresión

- Al guardar se registra: **forma de pago** (Efectivo, Yape, Plin, Tarjeta), **vendedora**, moneda (**solo soles** por ahora), cliente con **DNI o RUC** (se busca automáticamente; si no aparece, se ingresa a mano en una ventana), teléfono, dirección, **a cuenta** y **por pagar**.
- La vendedora puede **agregar filas extra** con descripción, cantidad y precio que ella pone (por ejemplo, instalación o accesorios).
- **Condiciones de venta fijas** al pie, aceptadas por el cliente:
  1. Nos reservamos el derecho de aceptar cambios y devoluciones independientemente del cobro del gasto generado.
  2. Es responsabilidad del cliente validar las especificaciones, condiciones especiales, de uso y diseño del producto adquirido.
  3. Toda mercadería separada que no es recogida dentro de un mes no se le reconocerá al cliente.
- La cotización guarda los **precios congelados**: si el CEO cambia un precio después, lo dicho al cliente no cambia. Al editarla, se avisa si el total con precios actuales sería distinto.
- «Mis cotizaciones» (el CEO ve todas y filtra por vendedora) y la cotización lista para **imprimir o guardar como PDF**, con número COT-000001, etc.
- Commits: `631c3e9`, `6abaa1e`, `b7c741e`, `5019470`, `d75248d`, `fb20262`, `2b4f207`, `64f0b02`, `b5fc6a0`, `483eed4`, `0f3b466`.

### 8. Historial de precios

- Cada cambio de precio queda registrado: quién, cuándo, precio anterior → nuevo, el porcentaje y un **motivo opcional**. No se puede borrar ni editar.
- Solo lo ve el CEO, en «Precios». Una **subida se muestra en verde** y una **bajada en rojo**, como pidió Dylan.
- Commits: `9a62aa5`, `5810939`, `154ba35`, `6a184d1`, `ccbed9a`, `0af1a92`, `a7bdd8d`.

### 9. Agenda de visitas técnicas

- Calendario con **vista mes y vista semana** (de 7:00 a 20:00) para agendar visitas de un técnico a casa u obra del cliente.
- Una visita tiene: **técnico** (lo elige la vendedora), **fecha y hora de inicio** (sin duración), tipo (medición, instalación, reparación u otro), **nombre del proyecto o trabajo**, **cliente y teléfono**, **ubicación**, **referencia** (opcional) y **especificaciones técnicas** (opcional). Todo es editable, incluido el técnico.
- Si el técnico ya tiene otra visita a menos de una hora, **se avisa pero se permite guardar**: la vendedora decide si cambia de técnico o si el cliente pasa a otro día.
- **Todas ven todas las visitas**; cada una edita solo las suyas y el **CEO edita todas**. Las visitas no se borran: se marcan realizadas o canceladas. Cada cambio queda en un historial.
- Los **técnicos no usan la app**: el CEO los registra en «Técnicos» con nombre, teléfono y color en el calendario, y los desactiva cuando dejan de trabajar.
- Extras: botón para enviar todo al técnico por **WhatsApp**, confirmar al cliente por WhatsApp, abrir la dirección en **Google Maps**, y **«Agendar visita» desde una cotización** guardada, que rellena los datos del cliente.
- Commits: `3e191dc`, `2aa765d`, `834fceb`, `a781183`, `5752d88`, `705a3fc`, `4833c4d`, `8d43317`, `3a380bc`.

### 10. Catálogo de productos e inventario por sede

Parte de rehacer el Excel anterior de Dylan (`Vidrieria-Alpamayo-1.xlsm`) y su hoja de inventario en Google Sheets. Un primer intento («Costos de proyectos», solo CEO) se descartó antes de hacer commit: los proyectos se cotizan con los **precios al público** del catálogo y los costos reales saldrán de las compras (sprint 11).

- **Catálogo con pestañas**: Vidrios (igual que antes), Aluminios por serie, Aluminios tradicionales, Accesorios y Acrílicos y otros. Cada producto tiene **un solo precio público** (IGV incluido) sea cual sea su color o medida; el aluminio se vende por varilla, los accesorios por unidad y los acrílicos y paneles por plancha. Todos lo ven y cualquier rol agrega productos **sin precio**.
- **Precios (CEO)**: las mismas pestañas; cada pestaña muestra cuántos productos siguen sin precio. Cada cambio queda en un **historial de precios de productos** con motivo opcional.
- **Inventario** (`/inventario`, todos los roles, sin costos): cada **artículo** es un producto o vidrio en un color y, para planchas, una medida exacta. Stock **por sede** (Principal y Almacén Los Libertadores), con total.
- **Estado automático**: sin contar, agotado (0), volver a comprar (en el mínimo o debajo) o en stock. «En camino» y notas se marcan a mano.
- **Movimientos**: la cantidad solo cambia registrando un **conteo**, una **entrada** o una **salida**, con motivo. Las entradas se pueden escribir en empaques (por ejemplo, 2 jabas de 20 = 40 planchas). El historial no se edita ni se borra y nunca deja el stock en negativo.
- **Datos de prueba** cargados desde la hoja de inventario (`mock-api/inventory-seed.json`): 47 vidrios nuevos con sus precios público y vidriero, 9 series, 428 productos, 531 artículos y el stock de 275 de ellos. La API los agrega al arrancar solo si faltan.
- Correcciones a la hoja al cargarla (anotadas para Dylan): precios público y plancha intercambiados en el incoloro semidoble, cantidad «19-19», medidas de acrílicos autocompletadas (181…187 × 120), nombres con errores en la Serie 25 y un código «2» en el policarbonato. Cuando un producto tenía precios distintos por color o por sede, se tomó el mayor.
- Commits: `729e831`, `b283860`, `ec0c8ce`, `45cda8d`, `3c75257`, `4e3f885`, `567316b`, `6fe91a8`, `8c98d5e`, `d8477ea`.

## Decisiones del negocio

Tomadas por Dylan durante los sprints. Si alguna cambia, hay que avisar antes de tocar el código.

| Tema | Decisión |
| --- | --- |
| Precio | Lo fija el CEO por pie², por vidrio y por lista de precio |
| Vidrio | Nombre + espesor + color |
| Fórmula | ((ancho × alto / 900) × precio pie²) × cantidad, medidas redondeadas hacia arriba a 5 cm |
| Unidades | cm, mm y pulgadas |
| Roles | CEO hace todo; Vendedora y Almacén comparten permisos y pueden agregar vidrios |
| Cuentas | Solo el CEO las crea; no hay registro público |
| Sesión | 8 horas |
| Moneda | Solo soles por ahora |
| Formas de pago | Efectivo, Yape, Plin, Tarjeta |
| Cliente | Por DNI o RUC con búsqueda automática; si no se encuentra, se ingresa a mano |
| Condiciones de venta | Las tres de arriba, fijas al pie de la cotización |
| Historial de precios | Solo lo ve el CEO; motivo opcional; subida en verde, bajada en rojo |
| Agenda: técnicos | No usan la app; el CEO mantiene la lista |
| Agenda: hora | Solo hora de inicio |
| Agenda: cruces | Se avisa y se permite guardar |
| Agenda: permisos | Todas ven todo; cada una edita lo suyo; el CEO edita todo |
| Precio de productos | Un precio público por producto (no por color), IGV incluido; lo fija el CEO |
| Cotizar proyectos | Con los precios al público del catálogo más mano de obra; la vendedora solo pone medidas, serie y hojas (fijas, corredizas, proyectantes) y ve el precio final |
| Inventario | Por artículo exacto (color y medida) y por sede: Principal y Almacén Los Libertadores. Stock en unidades; el empaque (jaba, paquete, caja) solo al ingresar |
| Inventario: permisos | Vendedora y Almacén ven y registran cantidades y jabas; solo el CEO verá dólares, flete y márgenes (sprint 11) |
| Costos (sprint 11) | Precio en dólares, tipo de cambio, flete y transporte Lima → Huaraz por envío, repartidos según el valor; se muestran el último costo y el promedio |

## Cómo probarlo

```bash
npm ci
npm run dev     # API de prueba (puerto 3000) + app (http://localhost:4200)
npm test        # 202 pruebas automáticas
npm run build   # build de producción sin errores ni advertencias
```

Usuarios de prueba (en `mock-api/README.md`): `ceo`, `vendedora` y `almacen`. Los datos de demostración están en `mock-api/db.json` (cotización COT-000001, técnicos y visitas) y en `mock-api/inventory-seed.json` (vidrios, productos, artículos y stock de la hoja de inventario).

## Problemas encontrados y cómo se resolvieron

| Problema | Solución |
| --- | --- |
| Pantalla en blanco al abrir `/` | La ruta raíz redirige primero al cotizador |
| Pantalla en blanco al abrir la app desde WebStorm (puerto 63342) | Aviso en la página que explica que hay que usar `npm start` o `npm run dev` |
| Pantalla en blanco al fallar la carga de una página | La app recarga una vez y, si sigue fallando, muestra un aviso |
| «Port already in use» al encender | Había otra copia encendida; se documentó en el README |
| La búsqueda por DNI devolvía la dirección vacía | Al combinar datos de cotizaciones anteriores solo se usan los campos llenos |
| Un commit de datos de prueba borró la cotización de demostración | Se restauró (`a7bdd8d`); antes de reemplazar `db.json` se revisa el historial |
| Colores del historial de precios invertidos | Subida en verde, bajada en rojo |

## Lo que falta

1. **Datos reales de la empresa** (solo Dylan): RUC, dirección y teléfono en `src/app/shared/domain/model/company-profile.ts`. Hoy la cotización impresa sale con datos de ejemplo.
2. **Mantenimiento**: actualizar Angular, Vite y Vitest (`npm audit` marca 49 avisos que venían de la plantilla); renombrar `SellerShell` y borrar los componentes que no se usan (`feature-placeholder`, `language-switcher`).
3. **Pruebas de punta a punta** de los recorridos de la demo: iniciar sesión con cada rol, cotizar, guardar e imprimir, cambiar un precio y verlo en el historial, agendar y editar una visita.
4. **Preparar la demo del 23 de diciembre**: datos de demostración creíbles y una guía corta de qué mostrar y en qué orden.
5. **Dependencia del servidor** (no es trabajo del frontend): el servidor real debe ofrecer los mismos endpoints que `mock-api/server.cjs`, incluida la consulta a RENIEC/SUNAT. Cuando exista, basta con cambiar `apiBaseUrl` en `src/environments/environment.ts`.
