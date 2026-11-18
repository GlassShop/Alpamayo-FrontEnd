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
