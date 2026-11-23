import { z } from "zod";

// CREATE PRODUCT
export const createProductSchema = z.object({
  name: z.string().min(3, "Nama produk minimal 3 karakter").max(150, "Nama produk maksimal 150 karakter"),
  categoryId: z.coerce.number().int().positive(),
  price: z.coerce.number().positive("Harga harus lebih dari 0"),
  stock: z.coerce.number().int().min(0, "Stok tidak boleh kurang dari 0").default(1),
  description: z.string().optional(),
});

// PRODUCT ID
export const productIdSchema = z.object({
  id: z.coerce.number().int().positive(),
});

// USER ID
export const userIdSchema = z.object({
  userId: z.coerce.number().int().positive(),
});

// USER PRODUCT PARAMS
export const userProductParamsSchema = z.object({
  userId: z.coerce.number().int().positive(),
  productId: z.coerce.number().int().positive(),
});

// UPDATE PRODUCT PARAMS
export const updateProductParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

// UPDATE PRODUCT
export const updateProductSchema = z.object({
  name: z.string().min(3, "Nama produk minimal 3 karakter").max(150, "Nama produk maksimal 150 karakter").optional(),
  categoryId: z.coerce.number().int().positive().optional(),
  price: z.coerce.number().positive("Harga harus lebih dari 0").optional(),
  stock: z.coerce.number().int().min(0, "Stok tidak boleh kurang dari 0").optional(),
  description: z.string().optional(),
});
