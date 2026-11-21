/**
 * Servicio de categorías (RF-P7): alta, edición y baja simples.
 * Leer: ambos roles. Crear y editar: solo admin.
 */
import { and, asc, eq, ne } from "drizzle-orm";
import { db } from "@/db/conexion";
import { categorias, productos } from "@/db/esquema";
import { ApiError, notFound } from "@/lib/errores";
import { parseInput } from "@/lib/validacion";
import { idParam } from "@/esquemas/comunes";
import { createCategorySchema, listCategoriesSchema, updateCategorySchema } from "@/esquemas/productos";
import { exigirAdmin, type AuthUser } from "./permisos";

export type PublicCategory = { id: number; nombre: string; activa: boolean; productosActivos: number };

const duplicatedName = () =>
  new ApiError(409, "NOMBRE_DUPLICADO", "Ya existe una categoría con ese nombre.", [
    { campo: "nombre", mensaje: "Ya existe una categoría con ese nombre." },
  ]);

/** Cuántos productos activos tiene una categoría (para no dejarlos sin categoría). */
const countActiveProducts = (categoryId: number) =>
  db.$count(productos, and(eq(productos.categoriaId, categoryId), eq(productos.activo, true)));

/** GET /api/categorias: las activas, sin paginar (§11.4). `todas=true` suma las inactivas. */
export async function listarCategorias(user: AuthUser, query: unknown = {}): Promise<PublicCategory[]> {
  const { todas } = parseInput(listCategoriesSchema, query);
  const rows = await db
    .select()
    .from(categorias)
    .where(todas ? undefined : eq(categorias.activa, true))
    .orderBy(asc(categorias.nombre));
  return Promise.all(
    rows.map(async (c) => ({ id: c.id, nombre: c.nombre, activa: c.activa, productosActivos: await countActiveProducts(c.id) })),
  );
}

/** POST /api/categorias (RF-P7). Solo admin. */
export async function crearCategoria(user: AuthUser, input: unknown): Promise<PublicCategory> {
  const { nombre } = parseInput(createCategorySchema, input);
  exigirAdmin(user);

  const existing = await db.query.categorias.findFirst({ where: eq(categorias.nombre, nombre) });
  if (existing) throw duplicatedName();

  const [created] = await db.insert(categorias).values({ nombre }).returning();
  return { id: created.id, nombre: created.nombre, activa: created.activa, productosActivos: 0 };
}

/**
 * PATCH /api/categorias/{id} (RF-P7). Solo admin.
 * No se puede desactivar una categoría que todavía tiene productos activos: 409 CATEGORIA_EN_USO.
 */
export async function actualizarCategoria(user: AuthUser, id: unknown, input: unknown): Promise<PublicCategory> {
  const categoryId = parseInput(idParam, id);
  const changes = parseInput(updateCategorySchema, input);
  exigirAdmin(user);

  const category = await db.query.categorias.findFirst({ where: eq(categorias.id, categoryId) });
  if (!category) throw notFound("La categoría");

  if (changes.nombre) {
    const existing = await db.query.categorias.findFirst({
      where: and(eq(categorias.nombre, changes.nombre), ne(categorias.id, categoryId)),
    });
    if (existing) throw duplicatedName();
  }

  const activeProducts = await countActiveProducts(categoryId);
  if (changes.activa === false && activeProducts > 0) {
    throw new ApiError(
      409,
      "CATEGORIA_EN_USO",
      `La categoría tiene ${activeProducts} producto(s) activo(s). Movelos o dalos de baja primero.`,
    );
  }

  const [updated] = await db.update(categorias).set(changes).where(eq(categorias.id, categoryId)).returning();
  return { id: updated.id, nombre: updated.nombre, activa: updated.activa, productosActivos: activeProducts };
}
