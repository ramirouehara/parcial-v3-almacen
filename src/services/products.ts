/**
 * Servicio de productos (RF-P1, RF-P2, RF-P3).
 * Leer: ambos roles. Alta, edición y baja: solo admin.
 * La existencia NO se edita acá: solo cambia con moverStock() (src/services/stock.ts).
 */
import { and, asc, eq, like, lt, ne, or, type SQL } from "drizzle-orm";
import { db, writeTransaction } from "@/db/client";
import { categorias, productos } from "@/db/schema";
import { ApiError, notFound } from "@/lib/errors";
import { parseInput } from "@/lib/validation";
import { idParam, type Paginated } from "@/schemas/common";
import { createProductSchema, listProductsSchema, updateProductSchema } from "@/schemas/products";
import { requireAdmin, type AuthUser } from "./permissions";
import { moverStock } from "./stock";

/** Lo que devuelve la API de un producto (§11.4). */
export type PublicProduct = {
  id: number;
  codigo: string;
  descripcion: string;
  categoria: { id: number; nombre: string };
  precio: number;
  existencia: number;
  stockMinimo: number;
  bajoMinimo: boolean;
  activo: boolean;
};

const productColumns = {
  p: productos,
  categoria: { id: categorias.id, nombre: categorias.nombre },
};

type ProductRow = { p: typeof productos.$inferSelect; categoria: { id: number; nombre: string } };

const toPublicProduct = ({ p, categoria }: ProductRow): PublicProduct => ({
  id: p.id,
  codigo: p.codigo,
  descripcion: p.descripcion,
  categoria,
  precio: p.precio,
  existencia: p.existencia,
  stockMinimo: p.stockMinimo,
  // RF-P1: marca para los productos con existencia por debajo del stock mínimo.
  bajoMinimo: p.existencia < p.stockMinimo,
  activo: p.activo,
});

const duplicatedCode = () =>
  new ApiError(409, "CODIGO_DUPLICADO", "Ya existe un producto con ese código.", [
    { campo: "codigo", mensaje: "Ya existe un producto con ese código." },
  ]);

async function findActiveCategory(id: number) {
  const category = await db.query.categorias.findFirst({ where: and(eq(categorias.id, id), eq(categorias.activa, true)) });
  if (!category) {
    throw new ApiError(422, "VALIDACION", "Hay campos con errores.", [
      { campo: "categoriaId", mensaje: "Elegí una categoría activa." },
    ]);
  }
  return category;
}

/** GET /api/productos/{id}. */
export async function getProduct(user: AuthUser, id: unknown): Promise<PublicProduct> {
  const productId = parseInput(idParam, id);
  const [row] = await db
    .select(productColumns)
    .from(productos)
    .innerJoin(categorias, eq(productos.categoriaId, categorias.id))
    .where(eq(productos.id, productId));
  if (!row) throw notFound("El producto");
  return toPublicProduct(row);
}

/**
 * GET /api/productos (RF-P1): búsqueda por código o descripción, filtro por categoría,
 * bajo mínimo y estado. Ver los inactivos ("false" o "todos") es solo para el admin.
 */
export async function listProducts(user: AuthUser, query: unknown): Promise<Paginated<PublicProduct>> {
  const { q, categoriaId, bajoMinimo, activo, page, pageSize } = parseInput(listProductsSchema, query);
  if (activo !== "true") requireAdmin(user);

  const filters: SQL[] = [];
  if (q) filters.push(or(like(productos.codigo, `%${q}%`), like(productos.descripcion, `%${q}%`))!);
  if (categoriaId) filters.push(eq(productos.categoriaId, categoriaId));
  if (bajoMinimo === true) filters.push(lt(productos.existencia, productos.stockMinimo), eq(productos.activo, true));
  if (activo !== "todos") filters.push(eq(productos.activo, activo === "true"));
  const where = and(...filters);

  const rows = await db
    .select(productColumns)
    .from(productos)
    .innerJoin(categorias, eq(productos.categoriaId, categorias.id))
    .where(where)
    .orderBy(asc(productos.descripcion))
    .limit(pageSize)
    .offset((page - 1) * pageSize);
  const total = await db.$count(productos, where);

  return { data: rows.map(toPublicProduct), page, pageSize, total };
}

/**
 * POST /api/productos (RF-P2). Solo admin.
 * Si llega `stockInicial`, se carga como un movimiento de ingreso con motivo
 * "Stock inicial", en la MISMA transacción que el alta (regla 2).
 */
export async function createProduct(user: AuthUser, input: unknown): Promise<PublicProduct> {
  const data = parseInput(createProductSchema, input);
  requireAdmin(user);

  await findActiveCategory(data.categoriaId);
  const existing = await db.query.productos.findFirst({ where: eq(productos.codigo, data.codigo) });
  if (existing) throw duplicatedCode();

  const productId = await writeTransaction(async (tx) => {
    const [created] = await tx
      .insert(productos)
      .values({
        codigo: data.codigo,
        descripcion: data.descripcion,
        categoriaId: data.categoriaId,
        precio: data.precio,
        stockMinimo: data.stockMinimo,
      })
      .returning({ id: productos.id });

    if (data.stockInicial) {
      await moverStock(tx, {
        productoId: created.id,
        tipo: "ingreso",
        cantidad: data.stockInicial,
        motivo: "Stock inicial",
        usuarioId: user.id,
      });
    }
    return created.id;
  });

  return getProduct(user, productId);
}

/**
 * PATCH /api/productos/{id} (RF-P2, RF-P3). Solo admin.
 * `activo: false` es la baja lógica: deja de ofrecerse en ventas pero conserva su historial.
 * Cambiar el precio no toca las facturas ya emitidas (regla 3: guardan su propio precio).
 */
export async function updateProduct(user: AuthUser, id: unknown, input: unknown): Promise<PublicProduct> {
  const productId = parseInput(idParam, id);
  const changes = parseInput(updateProductSchema, input);
  requireAdmin(user);

  const product = await db.query.productos.findFirst({ where: eq(productos.id, productId) });
  if (!product) throw notFound("El producto");

  if (changes.categoriaId && changes.categoriaId !== product.categoriaId) await findActiveCategory(changes.categoriaId);
  if (changes.codigo) {
    const existing = await db.query.productos.findFirst({
      where: and(eq(productos.codigo, changes.codigo), ne(productos.id, productId)),
    });
    if (existing) throw duplicatedCode();
  }

  await db.update(productos).set(changes).where(eq(productos.id, productId));
  return getProduct(user, productId);
}
