import { Request, Response } from "express";
import { loginSchema, registerSchema } from "../../validation/auth.validation";
import { db } from "../../config/db";
import { rolesTable, usersTable } from "../../config/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export class AuthController {
  register = async (req: Request, res: Response) => {
    try {
      const validatedData = registerSchema.parse(req.body);
      const { username, email, password } = validatedData;

      const existingEmail = await db.query.usersTable.findFirst({
        where: eq(usersTable.email, email),
      });

      if (existingEmail) {
        return res.status(409).json({
          success: false,
          message: "Email already exists",
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const [userRole] = await db
          .select()
          .from(rolesTable)
          .where(eq(rolesTable.title, "user"))
          .limit(1);

      if (!userRole) {
          return res.status(404).json({
              success: false,
              message: "Role User tidak ditemukan"
          });
      }

      const [insertedUser] = await db
        .insert(usersTable)
        .values({
          username: username,
          email: email,
          password: hashedPassword,
          roleId: userRole.id,
        })
        .returning();

      const newUser = await db.query.usersTable.findFirst({
        where: eq(usersTable.id, insertedUser.id),
      });

      return res.status(201).json({
        success: true,
        message: "Register successful",
        data: {
          user: {
            id: newUser?.id,
            username: newUser?.username,
            email: newUser?.email,
            roleId: newUser?.roleId,
          },
        },
      });
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  };

  login = async (req: Request, res: Response) => {
    try {
      // 1. VALIDATION
      const validatedData = loginSchema.parse(req.body);
      const { email, password } = validatedData;

      // 2. FIND USER BY EMAIL
      const user = await db.query.usersTable.findFirst({
        where: eq(usersTable.email, email),
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Email or password incorrect",
        });
      }

      // 3. CHECK PASSWORD
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: "Email or password incorrect",
        });
      }

      const token = jwt.sign(
        {
          id: user.id,
          username: user.username,
          email: user.email,
          roleId: user.roleId,
        },
        process.env.JWT_SECRET as string,
        {
          expiresIn: "7d",
        },
      );

      return res.status(200).json({
        success: true,
        message: "Login successful",
        data: {
          token,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            roleId: user.roleId,
          },
        },
      });
    } catch (error) {
        console.error("LOGIN ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
      });
    }
  };
}

export default new AuthController();
