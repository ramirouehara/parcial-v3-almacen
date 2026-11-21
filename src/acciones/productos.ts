"use server";

/** Server Actions de productos, categorías y stock (RF-P2 a RF-P5, RF-P7). Los mismos servicios que la API. */
import { action } from "@/lib/accion";
import { crearCategoria, actualizarCategoria } from "@/servicios/categorias";
import { crearProducto, actualizarProducto } from "@/servicios/productos";
import { registrarMovimiento } from "@/servicios/stock";

export const crearProductoAccion = action((user, input: unknown) => crearProducto(user, input));

export const actualizarProductoAccion = action((user, id: number, input: unknown) => actualizarProducto(user, id, input));

export const registrarMovimientoAccion = action((user, productId: number, input: unknown) =>
  registrarMovimiento(user, productId, input),
);

export const crearCategoriaAccion = action((user, input: unknown) => crearCategoria(user, input));

export const actualizarCategoriaAccion = action((user, id: number, input: unknown) => actualizarCategoria(user, id, input));
