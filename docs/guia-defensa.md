# Guía de defensa

Para cada pregunta de ejemplo del enunciado: la respuesta corta y **dónde está en el código** (`archivo:línea`). En VS Code, `Cmd + P` y pegar `archivo:línea` abre el archivo en esa línea.

## 1. La idea que responde casi todo

Cada regla de negocio vive en **un solo lugar: `src/services/`**. Un pedido recorre siempre el mismo camino:

```text
Pantalla (src/app/(app)/...)  o  curl
        │
Puerta: Route Handler (src/app/api/**/route.ts) con route()   o   Server Action (src/actions/) con action()
        │        (exigen la sesión y traducen errores; no deciden nada)
Servicio (src/services/*.ts):  1) valida con Zod  2) verifica el rol  3) aplica las reglas (con transacción si toca varias tablas)
        │
Base de datos (src/db/)
```

Si preguntan «¿dónde se controla X?», la respuesta es un archivo de `src/services/`.

## 2. Preguntas del enunciado

### Base de datos

| Pregunta | Respuesta | Dónde |
| --- | --- | --- |
| ¿Dónde se definen las tablas? | En el esquema de Drizzle, las 9 tablas del §7 | `src/db/schema.ts:26` (usuarios), `:46` (productos), `:166` (facturas) |
| ¿Dónde se conecta con la base? ¿Cómo sabe si usar la local o Turso? | `createClient` con `DATABASE_URL`: `file:...` es SQLite local; `libsql://...` con `DATABASE_AUTH_TOKEN` es Turso. El código es el mismo | `src/db/client.ts:9` |
| ¿Cómo se crea una tabla o se agrega un campo? ¿Qué es una migración? | Se cambia `schema.ts`, `pnpm run db:generate` escribe el SQL de la diferencia (la migración) y `pnpm run db:migrate` lo aplica | `src/db/migrations/` |
| ¿Dónde se cargan los datos de prueba? | En el seed, con los mismos servicios de la app | `src/db/seed.ts:123` |
| ¿Cómo se guardan los importes? ¿Por qué no coma flotante? | Centavos enteros: `0.1 + 0.2` no da `0.3` en coma flotante; con enteros la cuenta es exacta | `src/db/schema.ts:56`, `src/lib/format.ts:13` |
| ¿La existencia se guarda o se calcula? ¿Y el saldo? | La existencia se guarda y solo la cambia `moverStock()`. El saldo se calcula: débitos menos créditos | `src/services/stock.ts:52`, `src/services/customers.ts:47` |
| ¿Qué tablas se modifican al confirmar una factura? | `facturas`, `factura_items`, `productos` (existencia), `movimientos_stock` y, si es a cuenta, `movimientos_cuenta` | `src/services/invoices.ts:73` (pasos 1 a 9 comentados) |

### API REST

| Pregunta | Respuesta | Dónde |
| --- | --- | --- |
| ¿Dónde se expone la API para agregar un producto? | `POST /api/productos`, una línea que llama al servicio | `src/app/api/productos/route.ts:7` → `src/services/products.ts:109` |
| ¿Qué responde si el código ya existe? | `409 CODIGO_DUPLICADO` con el detalle en el campo `codigo` | `src/services/products.ts:50` |
| ¿Dónde se verifica la sesión antes de atender un pedido? | Tres barreras: el proxy, `requirePageUser()` en las páginas y `route()` / `action()` en la API y las acciones. El usuario se busca en la base en cada pedido | `src/proxy.ts:12`, `src/lib/session.ts:40`, `src/lib/api.ts:47`, `src/lib/action.ts:16` |
| ¿Qué pasa si un vendedor llama a una ruta de admin? Muéstrenlo | `403 SIN_PERMISO`, lo decide `requireAdmin()` en el servicio. Ver sección 4 | `src/services/permissions.ts:13` |
| ¿Dónde se arma la respuesta de error? | Los servicios lanzan `ApiError`; `errorResponse()` arma `{ error: { code, message, details } }` | `src/lib/errors.ts:38`, `src/lib/api.ts:41` |
| ¿Por qué el cliente no manda el precio ni el total? | Porque se podría falsear. El servidor toma el precio del catálogo y calcula todo; el esquema rechaza un campo `precio` | `src/services/invoices.ts:118`, `src/schemas/invoices.ts:13` |

### Reglas de negocio

| Pregunta | Respuesta | Dónde |
| --- | --- | --- |
| ¿Dónde se verifica que el stock no quede negativo? | En `moverStock()`, con `UPDATE ... WHERE existencia + cantidad >= 0`; además la base tiene un `CHECK` | `src/services/stock.ts:56`, `src/db/schema.ts:66` |
| ¿Qué pasa si dos vendedores venden la última unidad a la vez? | Se confirma una sola factura; la otra recibe `409 STOCK_INSUFICIENTE`. Hay un test que lo prueba | `src/services/invoices.ts:171`, `tests/services.test.ts` |
| ¿Dónde se asegura que una factura se grabe completa o nada? | Todo pasa dentro de `writeTransaction()`: si un paso lanza error, se deshace todo | `src/services/invoices.ts:76`, `src/db/client.ts:36` |
| ¿Dónde se asigna el número? ¿Cómo se evitan huecos? | Al confirmar, como «último + 1» dentro de la transacción, que corre de a una. Si la venta falla, no se gasta ningún número | `src/services/invoices.ts:146`, `:56` |
| Si cambia el precio de un producto, ¿qué pasa con las facturas ya emitidas? | Nada: cada renglón guarda su precio y su descripción copiados (regla 3) | `src/services/invoices.ts:118`, `src/db/schema.ts` (`factura_items`) |
| ¿Dónde se impide vender en cuenta corriente a consumidor final? | En el paso 2 de `createInvoice` | `src/services/invoices.ts:102` |
| ¿Dónde se controla el límite de crédito? | En el paso 5: saldo actual + total no puede pasar el límite | `src/services/invoices.ts:138` |
| ¿Dónde se impide un pago mayor que la deuda? | En `registerPayment` | `src/services/payments.ts:33` |
| ¿Qué hace el sistema al anular una factura? | Marca la factura como anulada (no se borra), reingresa el stock con movimientos de anulación y, si fue a cuenta, acredita el total. Todo en una transacción | `src/services/invoices.ts:337` |
| ¿Dónde queda registrado cada movimiento de stock? | En `movimientos_stock`, lo escribe `moverStock()`. Se ve en la ficha del producto y en Productos → Existencias | `src/services/stock.ts:52` |

### Seguridad y permisos

| Pregunta | Respuesta | Dónde |
| --- | --- | --- |
| ¿En qué parte se ingresa el número de tarjeta? | En ninguna: solo se piden tipo, marca y últimos 4 dígitos. Si llega el número completo, el esquema lo rechaza con 422 | `src/schemas/invoices.ts:32`, `src/db/schema.ts:186` |
| ¿Cómo se guardan las contraseñas? | Como hash bcrypt; nunca la contraseña en sí | `src/services/auth.ts:15` |
| ¿Dónde se verifica el rol? ¿Alcanza con ocultar el botón? | En el servicio, con `requireAdmin()`. No alcanza: con `curl` el botón no existe y la API igual responde 403 | `src/services/permissions.ts:13` |
| ¿Dónde está el secreto de la sesión? ¿Por qué no está en el repo? | En la variable `SESSION_SECRET` (`.env` local, variables de Vercel en producción). Con él cualquiera fabricaría una cookie de admin | `src/lib/session-token.ts:18` |
| Si se desactiva a un usuario con la sesión abierta, ¿qué pasa? | Pierde el acceso en el próximo pedido: el usuario se busca en la base en cada pedido y tiene que estar activo | `src/services/auth.ts:45` |

### Interfaz

| Pregunta | Respuesta | Dónde |
| --- | --- | --- |
| ¿Dónde se define el panel lateral? | En el layout del grupo `(app)` y el componente `AppShell` | `src/app/(app)/layout.tsx`, `src/components/shell/app-shell.tsx:76` |
| ¿Dónde se da formato a importes y fechas? | En un único módulo | `src/lib/format.ts:13` (moneda), `:53` (fecha) |
| ¿Dónde se validan los formularios? ¿Mismas reglas en el servidor? | Con el mismo esquema Zod: `useForm` lo corre antes de enviar y `parseInput()` en el servicio | `src/hooks/use-form.ts:27`, `src/lib/validation.ts:27` |
| ¿Cómo se agrega un producto a la venta solo con el teclado? | Se escribe el código o la descripción, ↑/↓ para elegir, Enter agrega. Enter con el buscador vacío pasa al pago; Enter en el pago confirma | `src/components/sales/product-search.tsx:56` |
| ¿Qué muestra un listado mientras carga, vacío o con error? | `loading.tsx` (esqueletos), `EmptyState` y `error.tsx` con botón Reintentar | `src/app/(app)/loading.tsx`, `src/components/common/states.tsx`, `src/app/(app)/error.tsx` |

### Publicación

| Pregunta | Respuesta |
| --- | --- |
| ¿Qué variables de entorno necesita en producción y dónde se cargan? | `DATABASE_URL`, `DATABASE_AUTH_TOKEN` y `SESSION_SECRET`, en Vercel → Settings → Environment Variables |
| ¿Cómo se crearon las tablas en Turso? | Corriendo `pnpm run db:migrate` con `DATABASE_URL` y `DATABASE_AUTH_TOKEN` de Turso (las mismas migraciones que en local); después `pnpm run db:seed` |
| ¿Cómo se comprueba que el sitio usa Turso y no una base local? | Se carga una venta en la URL pública y se ve en el panel de Turso (o con `turso db shell`); además, en Vercel no hay disco donde guardar un archivo SQLite |

### Uso de IA

Ver la sección «Uso de inteligencia artificial» del README: el CSS que se actualizaba tarde, el saldo mal calculado por la subconsulta y el alta de cliente que confirmaba la venta.

## 3. Lista de control (§10.8) y cómo mostrarla

| # | Qué se verifica | Cómo mostrarlo |
| --- | --- | --- |
| 1 | Rutas y acciones sin reglas | Abrir `src/app/api/productos/route.ts` y `src/actions/products.ts`: son una línea que llama al servicio |
| 2 | Vendedor en ruta de admin → 403 | Comandos de la sección 4 |
| 3 | Una operación que falla a mitad no deja datos parciales | `pnpm test`: «una venta que supera el límite de crédito no graba NADA» y «se deshace lo ya escrito» |
| 4 | Dos ventas de la última unidad → una sola factura | `pnpm test`: «dos ventas simultáneas...». O con `curl` (sección 4) |
| 5 | Existencia = suma de movimientos; saldo = débitos − créditos | `pnpm run db:check` |
| 6 | El mismo Zod en formulario y servidor | `src/schemas/products.ts:27` se importa en `src/components/products/product-form-dialog.tsx` y en `src/services/products.ts` |
| 7 | Ubicar una regla y cambiarla en un solo lugar | Sección 5 |

## 4. Comandos para mostrar en vivo

```bash
# Login como vendedor, guardando la cookie:
curl -c vend.txt -X POST localhost:3000/api/auth/login -H 'content-type: application/json' \
     -d '{"email":"vendedor@reydani.test","password":"vendedor1234"}'

# Ruta de admin con esa cookie -> 403 SIN_PERMISO:
curl -b vend.txt -X POST localhost:3000/api/productos -H 'content-type: application/json' \
     -d '{"codigo":"X-1","descripcion":"Prueba","categoriaId":1,"precio":100,"stockMinimo":0}'

# Sin cookie -> 401:
curl localhost:3000/api/productos

# Dos ventas a la vez del desodorante PE-004 (id 30, el seed lo deja con 1 unidad): una da 201 y la otra 409.
for i in 1 2; do curl -s -o /dev/null -w "%{http_code}\n" -b vend.txt -X POST localhost:3000/api/facturas \
  -H 'content-type: application/json' \
  -d '{"clienteId":null,"items":[{"productoId":30,"cantidad":1}],"pago":{"forma":"contado"}}' & done; wait

# Controles de consistencia y tests:
pnpm run db:check
pnpm test
```

## 5. Los cambios chicos de ejemplo: dónde se hacen

| Cambio pedido | Qué tocar |
| --- | --- |
| Agregar «marca» a los productos y mostrarla | 1) `src/db/schema.ts` (tabla `productos`): `marca: text("marca")`. 2) `pnpm run db:generate` y `pnpm run db:migrate`. 3) `src/schemas/products.ts:27` y `:40`: `marca: optionalText(40)`. 4) `src/services/products.ts`: sumarla a `PublicProduct` y `toPublicProduct`. 5) Campo en `product-form-dialog.tsx` y columna en `src/app/(app)/productos/page.tsx` |
| Agregar «Mercado Pago» como medio de pago | `src/schemas/customers.ts:5` (`mediosPago`), `src/db/schema.ts:157` (enum de `pagos.medio`) + migración, y la etiqueta en `src/lib/labels.ts` |
| Máximo 50 unidades de un producto por venta | `src/schemas/invoices.ts:13`: `.max(50, { error: "Máximo 50 unidades." })` en `cantidad`. Se aplica en la pantalla y en la API a la vez |
| Teléfono del cliente con al menos 8 dígitos | `src/schemas/customers.ts:32`: cambiar `telefono: optionalText(40)` por una regla que cuente dígitos. Formulario y servidor usan el mismo esquema |
| Agregar una columna al listado de facturas | `src/app/(app)/ventas/page.tsx`: un `TableHead` y un `TableCell`; si el dato no viene, sumarlo en `listInvoices` (`src/services/invoices.ts:265`) |
| Punto de venta `0002` | `src/lib/store.ts:17`: `PUNTO_VENTA = 2`. La numeración arranca en `0002-00000001` |

## 6. Guion de la demo (10 minutos, sobre la URL pública)

1. **Login** como administrador. Mostrar el tablero: ventas de hoy y del mes, deuda, bajo mínimo y gráficos.
2. **Venta a consumidor final en efectivo**: Ventas → Nueva venta. Buscar un producto, Enter, Enter con el buscador vacío, escribir el monto recibido (se ve el vuelto), Enter. Mostrar el comprobante.
   - **Verificar**: en Productos, la existencia bajó y la ficha muestra el movimiento «Venta 0001-...».
3. **Venta a un cliente nuevo en cuenta corriente**: Nueva venta → botón de nuevo cliente, cargarlo con cuenta corriente y límite, agregar productos, pestaña «Cta. cte.», confirmar.
   - **Verificar**: Clientes → ficha del cliente: saldo igual al total y el débito en la cuenta corriente.
4. **Pago de ese cliente**: en la ficha, «Registrar pago» por una parte de la deuda. Se abre el recibo numerado.
   - **Verificar**: el saldo bajó y la cuenta corriente muestra el crédito con el saldo acumulado.
5. **Anulación**: abrir una factura y «Anular» con un motivo.
   - **Verificar**: la factura figura «Anulada», el stock volvió (movimiento «Anulación») y, si era a cuenta, el saldo bajó.
6. Si sobra tiempo: `pnpm run db:check` y el 403 del vendedor con `curl`.
