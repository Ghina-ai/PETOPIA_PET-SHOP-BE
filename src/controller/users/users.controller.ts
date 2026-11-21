import { Request, Response } from "express";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import { usersTable, rolesTable } from "../../config/schema";
import { db } from "../../config/db";
import { AuthRequest } from "../../middleware/auth.middleware";
import { uploadToCloudinary } from "../../services/cloudinary.services";
import { createUserSchema, updateProfileSchema, } from "../../validation/users.validation";

type RequestWithFile = AuthRequest & {
  file?: Express.Multer.File;
};

export class UserController {
  // REGISTER USER
  createUser = async (req: Request, res: Response) => {
    try {
      // 1. Validasi request body
      const validation = createUserSchema.parse(req.body);

      // 2. Ambil data yang sudah tervalidasi
      const { username, email, password } = validation;

      // 3. Cari role User
      const [userRole] = await db
        .select()
        .from(rolesTable)
        .where(eq(rolesTable.title, "user"))
        .limit(1);

      if (!userRole) {
        return res.status(404).json({
          success: false,
          message: "Role User tidak ditemukan",
        });
      }

      // 4. Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // 5. Insert data ke database
      const [newUser] = await db
        .insert(usersTable)
        .values({
          username,
          email,
          password: hashedPassword,
          roleId: userRole.id,
        })
        .returning({
          id: usersTable.id,
          username: usersTable.username,
          email: usersTable.email,
          roleId: usersTable.roleId,
        });

      // 6. Response
      return res.status(201).json({
        success: true,
        message: "User registered successfully",
        data: newUser,
      });
    } catch (error: any) {
      if (error.code === "23505") {
        return res.status(409).json({
          success: false,
          message: "Email already registered",
        });
      }

      if (error.name === "ZodError") {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: error.issues,
        });
      }

      console.error(error);

      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  };

  // UPDATE USER PROFILE
  updateProfile = async (req: RequestWithFile, res: Response) => {
    try {
      // 1. Ambil ID User dari token login
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      // 2. Validasi request body
      const validation = updateProfileSchema.parse(req.body);

      // 3. Cari data User
      const [existingUser] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.id, userId))
        .limit(1);

      if (!existingUser) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // 4. Siapkan data yang akan diupdate
     const updateData: {
        username?: string;
        bio?: string | null;
        image?: string | null;
        imagePublicId?: string | null;
      } = {};

      if (validation.username !== undefined) {
        updateData.username = validation.username;
      }

      if (validation.bio !== undefined) {
        updateData.bio = validation.bio;
      }

      // 5. Upload foto profil jika ada file
      if (req.file) {
        const uploadedImage = await uploadToCloudinary(req.file.buffer);

        updateData.image = uploadedImage.secure_url;
        updateData.imagePublicId = uploadedImage.public_id;
      }

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({
          success: false,
          message: "Tidak ada data profil yang diubah",
        });
      }

      // 6. Update data ke database
      const [updatedUser] = await db
        .update(usersTable)
        .set(updateData)
        .where(eq(usersTable.id, userId))
        .returning({
          id: usersTable.id,
          username: usersTable.username,
          email: usersTable.email,
          bio: usersTable.bio,
          image: usersTable.image,
          roleId: usersTable.roleId,
        });

      // 7. Response
      return res.status(200).json({
        success: true,
        message: "Profile updated successfully",
        data: updatedUser,
      });
    } catch (error: any) {
      if (error.code === "23505") {
        return res.status(409).json({
          success: false,
          message: "Username already exists",
        });
      }

      if (error.name === "ZodError") {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: error.issues,
        });
      }

      console.error(error);

      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  };

  // GET USER PROFILE
  getProfile = async (req: AuthRequest, res: Response) => {
    try {
      // Ambil ID user dari token
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      // Cari data user
      const [user] = await db
        .select({
          id: usersTable.id,
          username: usersTable.username,
          email: usersTable.email,
          bio: usersTable.bio,
          image: usersTable.image,
          roleId: usersTable.roleId,
        })
        .from(usersTable)
        .where(eq(usersTable.id, userId))
        .limit(1);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Profile retrieved successfully",
        data: user,
      });
    } catch (error: any) {
      console.error("get profile error:", error);

      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  };
}

export default new UserController();
