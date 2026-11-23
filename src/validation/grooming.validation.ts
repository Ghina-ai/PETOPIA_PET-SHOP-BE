import { z } from "zod";

const groomingStatusSchema = z.enum(["available", "unavailable"]);

// CREATE GROOMING
export const createGroomingSchema = z.object({
  name: z
    .string()
    .min(3, "Nama layanan minimal 3 karakter")
    .max(150, "Nama layanan maksimal 150 karakter"),
  description: z.string().nullable().optional(),
  treatments: z.string().nullable().optional(),
  price: z.coerce.number().positive("Harga harus lebih dari 0"),
});

// UPDATE GROOMING
export const updateGroomingSchema = z
  .object({
    name: z
      .string()
      .min(3, "Nama layanan minimal 3 karakter")
      .max(150, "Nama layanan maksimal 150 karakter")
      .optional(),

    description: z.string().nullable().optional(),
    treatments: z.string().nullable().optional(),
    price: z.coerce.number().positive("Harga harus lebih dari 0").optional(),
    status: groomingStatusSchema.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Minimal satu data harus diisi",
  });
