import { z } from "zod";

const optionalText = z.preprocess(
  (value) => value === "" ? undefined : value,
  z.string().optional()
);

const optionalNumber = z.preprocess(
  (value) => value === "" || value === undefined ? undefined : value,
  z.coerce.number().optional()
);

export const createPetSchema = z.object({
  name: z.string().min(2).max(100),
  type: z.string().min(1).max(50),
  breed: optionalText,
  gender: z.preprocess(
    (value) => value === "" ? undefined : value,
    z.enum(["male", "female"]).optional()
  ),
  age: optionalNumber.pipe(z.number().int().min(0).optional()),
  weight: optionalNumber.pipe(z.number().positive().optional()),
  notes: optionalText,
});

export const updatePetSchema = createPetSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Minimal satu data harus diisi",
  });
