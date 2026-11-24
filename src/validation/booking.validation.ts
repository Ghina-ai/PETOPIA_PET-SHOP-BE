import { z } from "zod";

export const createBookingSchema = z.object({
  petId: z.number().int().positive("Pet tidak valid"),
  layanan: z.number().int().positive("Layanan tidak valid"),
  bookingDate: z.string().min(1, "Tanggal booking wajib diisi"),
  notes: z.string().optional(),
});

export const assignEmployeeSchema = z.object({
  employeeId: z.number().int().positive("Karyawan tidak valid"),
});