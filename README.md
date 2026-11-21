# Almacén «Rey Dani» — Sistema de gestión comercial

Segundo parcial de Programación IV. Sistema web para un almacén de barrio: facturación con tres formas de pago, control de stock con movimientos y cuenta corriente de clientes («la libreta»), con un tablero de inicio.

**Grupo 21 · Comisión 3**

- Parras, Mateo
- Uehara Martorell, Ramiro
- Blanca, Leandro Ezequiel

**URL pública:** _se completa al publicar en Vercel_

## Qué hace

| Módulo | Pantallas | Requerimientos |
| --- | --- | --- |
| Inicio | Tablero: ventas del día y del mes, deuda en cuentas corrientes, productos bajo el mínimo, ventas diarias de 30 días, ventas por forma de pago y más vendidos | RF-T1 a RF-T3 |
| Ventas | Nueva venta (operable con teclado), listado de facturas con filtros, comprobante imprimible, anulación | RF-V1 a RF-V9 |
| Productos | Catálogo, ficha con movimientos, ingresos y egresos de stock, existencias, categorías | RF-P1 a RF-P7 |
| Clientes | Listado con saldo, ficha con cuenta corriente, registrar pago con recibo, saldos | RF-C1 a RF-C7 |
| Usuarios | Alta, edición, roles, restablecer contraseña, activar y desactivar | RF-U1 a RF-U5 |

Dos roles: **administrador** (puede todo) y **vendedor** (opera el mostrador; no toca usuarios, catálogo, stock manual ni anulaciones). Los permisos se verifican en el servidor.

## Puesta en marcha local

Requisitos: Node.js 20 o más nuevo y pnpm.

```bash
pnpm install
cp .env.example .env
pnpm run db:migrate
pnpm run db:seed
pnpm run dev
```

La app queda en <http://localhost:3000>. La base de desarrollo es un archivo SQLite en `data/almacen.db`.

## Usuarios de prueba

Los crea `pnpm run db:seed`:

| Rol | Email | Contraseña |
| --- | --- | --- |
| Administrador | `admin@reydani.test` | `admin1234` |
| Vendedor | `vendedor@reydani.test` | `vendedor1234` |

El seed también carga 5 categorías, 30 productos, 10 clientes y 50 facturas repartidas en los últimos 30 días, con pagos y dos anulaciones. Todo se crea **con los mismos servicios que usa la app** (§10.7), así cumple todas las reglas.

## Variables de entorno

Están documentadas en `.env.example`. Los secretos van solo en variables de entorno, nunca en el repositorio.

| Variable | Desarrollo | Producción (Vercel) |
| --- | --- | --- |
| `DATABASE_URL` | `file:./data/almacen.db` | `libsql://<base>.turso.io` |
| `DATABASE_AUTH_TOKEN` | vacío | El token de Turso |
| `SESSION_SECRET` | Cualquier texto de 32 caracteres o más | Un secreto aleatorio, por ejemplo `openssl rand -base64 32` |

## Scripts

| Comando | Qué hace |
| --- | --- |
| `pnpm run dev` | Servidor de desarrollo |
| `pnpm run build` / `pnpm start` | Compilación y servidor de producción |
| `pnpm run db:generate` | Genera una migración nueva a partir de `src/db/schema.ts` |
| `pnpm run db:migrate` | Aplica las migraciones a la base de `DATABASE_URL` |
| `pnpm run db:seed` | Vacía la base y carga los datos de prueba |
| `pnpm run db:check` | Controla la consistencia de los datos: existencia = suma de movimientos, numeración sin huecos, sin saldos a favor, totales |
| `pnpm test` | Tests con Vitest, contra una base temporal |
| `pnpm run lint` / `pnpm run typecheck` | ESLint y TypeScript |

## Tecnologías

Next.js 16 (App Router, Route Handlers, Server Actions) · TypeScript · Tailwind CSS 4 · shadcn/ui · Drizzle ORM con migraciones de drizzle-kit · SQLite en desarrollo y Turso (libSQL) en producción · Zod · sesión propia en cookie firmada (JWT con `jose`) · bcrypt · Chart.js con react-chartjs-2 · Vitest · Vercel.

## Cómo está organizado

```text
src/
├── app/                 páginas (App Router) y API REST (app/api/**/route.ts)
│   ├── (app)/           pantallas internas: comparten el layout con panel lateral
│   └── login/           la única página pública
├── actions/             Server Actions (adaptadores de los formularios)
├── services/            TODAS las reglas de negocio (una por módulo)
├── schemas/             esquemas Zod, compartidos entre formulario y servidor
├── db/                  esquema, conexión, migraciones, seed y control de consistencia
├── lib/                 errores, sesión, envoltorios de rutas y acciones, formatos
├── hooks/               useForm: el hook común de formularios
└── components/          interfaz: primitivas, shadcn/ui y componentes por módulo
tests/                   tests de formatos, esquemas y servicios
```

El principio que ordena todo (§10): **cada regla de negocio vive en un único lugar, la capa de servicios**. Las rutas de la API y las Server Actions son adaptadores finos que solo llaman al servicio. La guía de defensa ([docs/guia-defensa.md](docs/guia-defensa.md)) dice en qué archivo y línea está cada cosa.

## Decisiones de diseño

- **Importes en centavos enteros** (regla 10). `1250000` son $ 12.500,00. Los formatos están en un único módulo: `src/lib/format.ts`.
- **La existencia se guarda** en `productos.existencia` y **solo cambia con `moverStock()`**, que actualiza con la condición `existencia + cantidad >= 0` y graba el movimiento en la misma transacción. Además, la base tiene un `CHECK (existencia >= 0)` como última defensa.
- **El saldo del cliente no se guarda**: siempre son los débitos menos los créditos de `movimientos_cuenta` (regla 7). Una sola fuente de verdad.
- **Numeración**: el número de factura y el de recibo se asignan como «último + 1» **dentro de la transacción de escritura**, así no quedan huecos ni números repetidos. Hay además un índice único sobre punto de venta y número.
- **Ventas simultáneas**: dos vendedores que venden la última unidad al mismo tiempo terminan con una sola factura; la otra recibe `409 STOCK_INSUFICIENTE`. Lo prueba `tests/services.test.ts`.
- **Anulación a cuenta corriente**: se sigue el §11.6 y se acredita el total de la factura. Si el cliente ya hubiera pagado parte, eso podría dejar un saldo a favor, que la regla 8 no admite. El enunciado no resuelve ese caso; lo dejamos documentado acá y el seed anula antes de registrar pagos.
- **Interfaz propia**: paleta inspirada en el norte argentino (verde, mostaza y la franja de colores del aguayo en el panel lateral), tipografías Bricolage Grotesque, Figtree e IBM Plex Mono para los números.
- **Datos del comercio**: solo el nombre es real; domicilio, CUIT y teléfono son de fantasía (`src/lib/store.ts`).

## Uso de inteligencia artificial

Desarrollamos el sistema con **Claude Code** como agente, siguiendo el enunciado paso a paso en commits chicos. Cada integrante revisó, probó y puede explicar cada parte. Algunos errores del agente que detectamos y corregimos:

- **El CSS se actualizaba un guardado tarde** (el loader de Tailwind de la plantilla). Se reemplazó por el plugin de PostCSS que indica la documentación de Next (commit `fix: run Tailwind through PostCSS...`).
- **El saldo de los clientes salía mal**: en la subconsulta SQL, Drizzle escribía `"id"` sin el nombre de la tabla y comparaba el id del movimiento en vez del id del cliente. Se encontró probando con `curl` (un pago mayor que la deuda era aceptado) y se corrigió escribiendo la subconsulta con nombres completos (`src/services/customers.ts`).
- **El alta de cliente desde Nueva venta confirmaba la venta**: el formulario del diálogo está dentro del formulario de la venta y el evento `submit` subía por el árbol de React. Se agregó `stopPropagation()`.
