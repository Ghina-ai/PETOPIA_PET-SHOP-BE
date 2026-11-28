import { Request, Response } from "express";
import { eq } from "drizzle-orm";
import { db } from "../../config/db";
import { groomingServicesTable } from "../../config/schema";
import { createGroomingSchema, updateGroomingSchema } from "../../validation/grooming.validation";
import { uploadToCloudinary } from "../../services/cloudinary.services";

type RequestWithFile = Request & {
  file?: Express.Multer.File;
};

class GroomingController {
  // CREATE GROOMING
  createGrooming = async (req: RequestWithFile, res: Response) => {
    try {
      const validatedData = createGroomingSchema.parse(req.body);

      const { name, description, treatments, price } = validatedData;

      let imageUrl: string | null = null;
      let imagePublicId: string | null = null;

      if (req.file) {
        const uploadedImage = await uploadToCloudinary(req.file.buffer);
        imageUrl = uploadedImage.secure_url;
        imagePublicId = uploadedImage.public_id;
      }

      const [newGrooming] = await db
        .insert(groomingServicesTable)
        .values({
          name,
          description: description ?? null,
          treatments: treatments ?? null,
          price: String(price),
          image: imageUrl,
          imagePublicId,
        })
        .returning();

      return res.status(201).json({
        success: true,
        message: "Layanan grooming berhasil ditambahkan",
        data: newGrooming,
      });
    } catch (error: any) {
      console.error("Create grooming error:", error);

      return res.status(error.name === "ZodError" ? 400 : 500).json({
        success: false,
        message:
          error.name === "ZodError"
            ? "Data grooming tidak valid"
            : "Terjadi kesalahan pada server",
        error: error.message,
      });
    }
  };

  // GET ALL GROOMING
  getAllGrooming = async (_req: Request, res: Response) => {
    try {
      const grooming = await db
        .select()
        .from(groomingServicesTable);

      return res.status(200).json({
        success: true,
        message: "Berhasil mengambil semua layanan grooming",
        data: grooming,
      });
    } catch (error: any) {
      console.error("Get all grooming error:", error);

      return res.status(500).json({
        success: false,
        message: "Terjadi kesalahan pada server",
      });
    }
  };

  // GET GROOMING BY ID
  getGroomingById = async (req: Request, res: Response) => {
    try {
      const groomingId = Number(req.params.id);

      if (!Number.isInteger(groomingId) || groomingId <= 0) {
        return res.status(400).json({
          success: false,
          message: "ID grooming tidak valid",
        });
      }

      const [grooming] = await db
        .select()
        .from(groomingServicesTable)
        .where(eq(groomingServicesTable.id, groomingId))
        .limit(1);

      if (!grooming) {
        return res.status(404).json({
          success: false,
          message: "Layanan grooming tidak ditemukan",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Berhasil mengambil detail grooming",
        data: grooming,
      });
    } catch (error: any) {
      console.error("Get grooming by id error:", error);

      return res.status(500).json({
        success: false,
        message: "Terjadi kesalahan pada server",
      });
    }
  };

  // UPDATE GROOMING
  updateGrooming = async (req: RequestWithFile, res: Response) => {
    try {
      const groomingId = Number(req.params.id);

      if (!Number.isInteger(groomingId) || groomingId <= 0) {
        return res.status(400).json({
          success: false,
          message: "ID grooming tidak valid",
        });
      }

      const validatedData = updateGroomingSchema.parse(req.body);

      const [existingGrooming] = await db
        .select()
        .from(groomingServicesTable)
        .where(eq(groomingServicesTable.id, groomingId))
        .limit(1);

      if (!existingGrooming) {
        return res.status(404).json({
          success: false,
          message: "Layanan grooming tidak ditemukan",
        });
      }

      const updateData: Partial<typeof groomingServicesTable.$inferInsert> = {};

      if (validatedData.name !== undefined) {
        updateData.name = validatedData.name;
      }

      if (validatedData.description !== undefined) {
        updateData.description = validatedData.description;
      }

      if (validatedData.treatments !== undefined) {
        updateData.treatments = validatedData.treatments;
      }

      if (validatedData.price !== undefined) {
        updateData.price = String(validatedData.price);
      }

      if (validatedData.status !== undefined) {
        updateData.status = validatedData.status;
      }

      if (req.file) {
        const uploadedImage = await uploadToCloudinary(req.file.buffer);
        updateData.image = uploadedImage.secure_url;
        updateData.imagePublicId = uploadedImage.public_id;
      }

      const [updatedGrooming] = await db
        .update(groomingServicesTable)
        .set(updateData)
        .where(eq(groomingServicesTable.id, groomingId))
        .returning();

      return res.status(200).json({
        success: true,
        message: "Layanan grooming berhasil diperbarui",
        data: updatedGrooming,
      });
    } catch (error: any) {
      console.error("Update grooming error:", error);

      return res.status(error.name === "ZodError" ? 400 : 500).json({
        success: false,
        message:
          error.name === "ZodError"
            ? "Data grooming tidak valid"
            : "Terjadi kesalahan pada server",
        error: error.message,
      });
    }
  };

  // DELETE GROOMING
  deleteGrooming = async (req: Request, res: Response) => {
    try {
      const groomingId = Number(req.params.id);

      if (!Number.isInteger(groomingId) || groomingId <= 0) {
        return res.status(400).json({
          success: false,
          message: "ID grooming tidak valid",
        });
      }

      const [deletedGrooming] = await db
        .delete(groomingServicesTable)
        .where(eq(groomingServicesTable.id, groomingId))
        .returning();

      if (!deletedGrooming) {
        return res.status(404).json({
          success: false,
          message: "Layanan grooming tidak ditemukan",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Layanan grooming berhasil dihapus",
        data: deletedGrooming,
      });
    } catch (error: any) {
      console.error("Delete grooming error:", error);

      return res.status(500).json({
        success: false,
        message: "Terjadi kesalahan pada server",
      });
    }
  };
}

export default new GroomingController();