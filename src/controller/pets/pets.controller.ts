import { Request, Response } from "express";
import { eq, and } from "drizzle-orm";
import { ZodError } from "zod";

import { db } from "../../config/db";
import { petsTable } from "../../config/schema";
import { uploadToCloudinary } from "../../services/cloudinary.services";
import {
  createPetSchema,
  updatePetSchema,
} from "../../validation/pets.validation";

const getUserId = (req: Request): number => {
  return (
    req as Request & {
      user: {
        id: number;
      };
    }
  ).user.id;
};

class PetsController {
  // TAMBAH PET
    createPet = async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const validatedData = createPetSchema.parse(req.body);
      const { name, type, breed, gender, age, weight, notes } = validatedData;

      let image: string | null = null;
      let imagePublicId: string | null = null;

      if (req.file) {
        const uploaded = await uploadToCloudinary(req.file.buffer);
        image = uploaded.secure_url;
        imagePublicId = uploaded.public_id;
      }

      const [newPet] = await db
        .insert(petsTable)
        .values({
          userId,
          name,
          type,
          breed,
          gender,
          age,
          weight: weight !== undefined ? String(weight) : undefined,
          notes,
          image,
          imagePublicId,
        })
        .returning();

      return res.status(201).json({
        success: true,
        message: "Hewan peliharaan berhasil ditambahkan",
        data: newPet,
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          message: "Validasi gagal",
          errors: error.issues,
        });
      }

      return res.status(500).json({
        success: false,
        message: "Gagal menambahkan hewan peliharaan",
        error,
      });
    }
  }

  // TAMPILKAN SEMUA PET MILIK USER
  getMyPets = async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);

      const pets = await db
        .select()
        .from(petsTable)
        .where(eq(petsTable.userId, userId));

      return res.status(200).json({
        success: true,
        message: "Data hewan peliharaan berhasil ditampilkan",
        data: pets,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Gagal mengambil data hewan peliharaan",
        error,
      });
    }
  }

  // TAMPILKAN DETAIL PET
  getPetById = async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const petId = Number(req.params.id);

      if (isNaN(petId)) {
        return res.status(400).json({
          success: false,
          message: "ID hewan tidak valid",
        });
      }

      const [pet] = await db
        .select()
        .from(petsTable)
        .where(and(eq(petsTable.id, petId), eq(petsTable.userId, userId)));

      if (!pet) {
        return res.status(404).json({
          success: false,
          message: "Data hewan tidak ditemukan",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Detail hewan berhasil ditampilkan",
        data: pet,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Gagal mengambil detail hewan",
        error,
      });
    }
  }

  // EDIT PET
  updatePet = async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const petId = Number(req.params.id);

      if (isNaN(petId)) {
        return res.status(400).json({
          success: false,
          message: "ID hewan tidak valid",
        });
      }

      const [existingPet] = await db
        .select()
        .from(petsTable)
        .where(and(eq(petsTable.id, petId), eq(petsTable.userId, userId)));

      if (!existingPet) {
        return res.status(404).json({
          success: false,
          message: "Data hewan tidak ditemukan",
        });
      }

      const validatedData = updatePetSchema.parse(req.body);
      const { weight, ...otherData } = validatedData;

      const updateData: Partial<typeof petsTable.$inferInsert> = {
        ...otherData,
      };

      if (weight !== undefined) {
        updateData.weight = String(weight);
      }

      if (req.file) {
        const uploaded = await uploadToCloudinary(req.file.buffer);
        updateData.image = uploaded.secure_url;
        updateData.imagePublicId = uploaded.public_id;
      }

      const [updatedPet] = await db
        .update(petsTable)
        .set(updateData)
        .where(and(eq(petsTable.id, petId), eq(petsTable.userId, userId)))
        .returning();

      return res.status(200).json({
        success: true,
        message: "Data hewan berhasil diperbarui",
        data: updatedPet,
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          message: "Validasi gagal",
          errors: error.issues,
        });
      }

      return res.status(500).json({
        success: false,
        message: "Gagal memperbarui data hewan",
        error,
      });
    }
  }

  // HAPUS PET
  deletePet = async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const petId = Number(req.params.id);

      if (isNaN(petId)) {
        return res.status(400).json({
          success: false,
          message: "ID hewan tidak valid",
        });
      }

      const [deletedPet] = await db
        .delete(petsTable)
        .where(and(eq(petsTable.id, petId), eq(petsTable.userId, userId)))
        .returning();

      if (!deletedPet) {
        return res.status(404).json({
          success: false,
          message: "Data hewan tidak ditemukan",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Data hewan berhasil dihapus",
        data: deletedPet,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Gagal menghapus data hewan",
        error,
      });
    }
  }
}

export default new PetsController;
