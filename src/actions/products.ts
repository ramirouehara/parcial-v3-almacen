"use server";

/** Server Actions de productos, categorías y stock (RF-P2 a RF-P5, RF-P7). Los mismos servicios que la API. */
import { action } from "@/lib/action";
import { createCategory, updateCategory } from "@/services/categories";
import { createProduct, updateProduct } from "@/services/products";
import { registerMovement } from "@/services/stock";

export const createProductAction = action((user, input: unknown) => createProduct(user, input));

export const updateProductAction = action((user, id: number, input: unknown) => updateProduct(user, id, input));

export const registerMovementAction = action((user, productId: number, input: unknown) =>
  registerMovement(user, productId, input),
);

export const createCategoryAction = action((user, input: unknown) => createCategory(user, input));

export const updateCategoryAction = action((user, id: number, input: unknown) => updateCategory(user, id, input));
