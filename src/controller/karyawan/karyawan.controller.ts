import { Request, Response } from "express";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import { usersTable, rolesTable } from "../../config/schema";
import { db } from "../../config/db";
import { createKaryawanSchema } from "../../validation/karyawan.validation";

export class KaryawanController {

    createKaryawan = async (req: Request, res: Response) => {
        try {

            // 1. Validasi request body
            const validation = createKaryawanSchema.parse(req.body);

            // 2. Ambil data yang sudah tervalidasi
            const { username, email, password } = validation;

            // 3. Cari role Karyawan
            const [karyawanRole] = await db
                .select()
                .from(rolesTable)
                .where(eq(rolesTable.title, "karyawan"))
                .limit(1);

            if (!karyawanRole) {
                return res.status(404).json({
                    success: false,
                    message: "Role Karyawan tidak ditemukan"
                });
            }

            // 4. Hash password
            const hashedPassword = await bcrypt.hash(password, 10);

            // 5. Insert data ke tabel users
            const [newKaryawan] = await db
                .insert(usersTable)
                .values({
                    username,
                    email,
                    password: hashedPassword,
                    roleId: karyawanRole.id
                })
                .returning({
                    id: usersTable.id,
                    username: usersTable.username,
                    email: usersTable.email,
                    roleId: usersTable.roleId
                });

            // 6. Response
            return res.status(201).json({
                success: true,
                message: "Karyawan berhasil ditambahkan",
                data: newKaryawan
            });

        } catch (error: any) {

            // Handle duplicate email
            if (error.code === "23505") {
                return res.status(409).json({
                    success: false,
                    message: "Email sudah terdaftar"
                });
            }

            console.error(error);

            return res.status(500).json({
                success: false,
                message: "Internal server error"
            });
        }
    }

}

export default new KaryawanController();
