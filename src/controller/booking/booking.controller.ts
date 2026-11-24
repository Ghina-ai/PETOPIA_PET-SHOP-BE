import { Request, Response } from "express";
import { eq, and, desc } from "drizzle-orm";
import { db } from "../../config/db";
import { bookingsTable, petsTable, groomingServicesTable, usersTable, rolesTable,} from "../../config/schema";

class BookingGrooming {
  // CREATE BOOKING 
  createBooking = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const { petId, layanan, bookingDate, pickup, address, notes } = req.body;

      if (!petId || !layanan || !bookingDate || !pickup) {
        return res.status(400).json({
          success: false,
          message: "Data booking belum lengkap",
        });
      }

      const [pet] = await db
        .select()
        .from(petsTable)
        .where(
          and(eq(petsTable.id, Number(petId)), eq(petsTable.userId, userId)),
        )
        .limit(1);

      if (!pet) {
        return res.status(404).json({
          success: false,
          message: "Hewan peliharaan tidak ditemukan",
        });
      }

      const [service] = await db
        .select()
        .from(groomingServicesTable)
        .where(eq(groomingServicesTable.id, Number(layanan)))
        .limit(1);

      if (!service || service.status !== "available") {
        return res.status(404).json({
          success: false,
          message: "Layanan grooming tidak tersedia",
        });
      }

      const date = new Date(bookingDate);

      if (isNaN(date.getTime()) || date <= new Date()) {
        return res.status(400).json({
          success: false,
          message: "Tanggal booking harus valid dan di masa mendatang",
        });
      }

      if (!["antar_sendiri", "jemput_pet"].includes(pickup)) {
        return res.status(400).json({
          success: false,
          message: "Metode penjemputan tidak valid",
        });
      }

      if (pickup === "jemput_pet" && !address) {
        return res.status(400).json({
          success: false,
          message: "Alamat penjemputan wajib diisi",
        });
      }

      const [booking] = await db
        .insert(bookingsTable)
        .values({
          userId,
          petId: Number(petId),
          layanan: Number(layanan),
          totalPrice: service.price,
          bookingDate: date,
          pickup,
          address: pickup === "jemput_pet" ? address : null,
          notes: notes || null,
        })
        .returning();

      return res.status(201).json({
        success: true,
        message: "Booking berhasil dibuat",
        data: booking,
      });
    } catch (error: any) {
      console.error("Create booking error:", error);

      return res.status(500).json({
        success: false,
        message: "Gagal membuat booking",
        error: error.message,
      });
    }
  };

  // VIEW BOOKING 
  viewBooking = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;

      const bookings = await db
        .select({
          id: bookingsTable.id,
          userId: bookingsTable.userId,
          petId: bookingsTable.petId,
          layanan: bookingsTable.layanan,
          totalPrice: bookingsTable.totalPrice,
          bookingDate: bookingsTable.bookingDate,
          pickup: bookingsTable.pickup,
          address: bookingsTable.address,
          notes: bookingsTable.notes,
          status: bookingsTable.status,
          employeeId: bookingsTable.employeeId,
          createdAt: bookingsTable.createdAt,
          petName: petsTable.name,
          serviceName: groomingServicesTable.name,
        })
        .from(bookingsTable)
        .leftJoin(petsTable, eq(bookingsTable.petId, petsTable.id))
        .leftJoin(
          groomingServicesTable,
          eq(bookingsTable.layanan, groomingServicesTable.id),
        )
        .where(eq(bookingsTable.userId, userId))
        .orderBy(desc(bookingsTable.createdAt));

      return res.status(200).json({
        success: true,
        message: "Data booking berhasil ditampilkan",
        data: bookings,
      });
    } catch (error: any) {
      console.error("View booking error:", error);

      return res.status(500).json({
        success: false,
        message: "Gagal mengambil data booking",
      });
    }
  };

  // CANCEL BOOKING 
  cancelBooking = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const bookingId = Number(req.params.id);

      if (!Number.isInteger(bookingId) || bookingId <= 0) {
        return res.status(400).json({
          success: false,
          message: "ID booking tidak valid",
        });
      }

      const [booking] = await db
        .select()
        .from(bookingsTable)
        .where(
          and(
            eq(bookingsTable.id, bookingId),
            eq(bookingsTable.userId, userId),
          ),
        )
        .limit(1);

      if (!booking) {
        return res.status(404).json({
          success: false,
          message: "Booking tidak ditemukan",
        });
      }

      if (!["pending", "confirmed"].includes(booking.status)) {
        return res.status(400).json({
          success: false,
          message: "Booking tidak bisa dibatalkan",
        });
      }

      const [cancelledBooking] = await db
        .update(bookingsTable)
        .set({
          status: "cancelled",
          updatedAt: new Date(),
        })
        .where(eq(bookingsTable.id, bookingId))
        .returning();

      return res.status(200).json({
        success: true,
        message: "Booking berhasil dibatalkan",
        data: cancelledBooking,
      });
    } catch (error: any) {
      console.error("Cancel booking error:", error);

      return res.status(500).json({
        success: false,
        message: "Gagal membatalkan booking",
      });
    }
  };

  // VIEW ALL BOOKING 
  viewAllBooking = async (_req: Request, res: Response) => {
    try {
      const bookings = await db
        .select({
          id: bookingsTable.id,
          userId: bookingsTable.userId,
          username: usersTable.username,
          petName: petsTable.name,
          serviceName: groomingServicesTable.name,
          totalPrice: bookingsTable.totalPrice,
          bookingDate: bookingsTable.bookingDate,
          pickup: bookingsTable.pickup,
          address: bookingsTable.address,
          notes: bookingsTable.notes,
          status: bookingsTable.status,
          employeeId: bookingsTable.employeeId,
          createdAt: bookingsTable.createdAt,
        })
        .from(bookingsTable)
        .leftJoin(usersTable, eq(bookingsTable.userId, usersTable.id))
        .leftJoin(petsTable, eq(bookingsTable.petId, petsTable.id))
        .leftJoin(
          groomingServicesTable,
          eq(bookingsTable.layanan, groomingServicesTable.id),
        )
        .orderBy(desc(bookingsTable.createdAt));

      return res.status(200).json({
        success: true,
        message: "Semua booking berhasil ditampilkan",
        data: bookings,
      });
    } catch (error: any) {
      console.error("View all booking error:", error);

      return res.status(500).json({
        success: false,
        message: "Gagal mengambil semua data booking",
      });
    }
  };

  // CONFIRM BOOKING ()
  confirmBooking = async (req: Request, res: Response) => {
    try {
      const bookingId = Number(req.params.id);

      if (!Number.isInteger(bookingId) || bookingId <= 0) {
        return res.status(400).json({
          success: false,
          message: "ID booking tidak valid",
        });
      }

      const [booking] = await db
        .select()
        .from(bookingsTable)
        .where(eq(bookingsTable.id, bookingId))
        .limit(1);

      if (!booking) {
        return res.status(404).json({
          success: false,
          message: "Booking tidak ditemukan",
        });
      }

      if (booking.status !== "pending") {
        return res.status(400).json({
          success: false,
          message: "Hanya booking pending yang bisa dikonfirmasi",
        });
      }

      const [confirmedBooking] = await db
        .update(bookingsTable)
        .set({
          status: "confirmed",
          updatedAt: new Date(),
        })
        .where(eq(bookingsTable.id, bookingId))
        .returning();

      return res.status(200).json({
        success: true,
        message: "Booking berhasil dikonfirmasi",
        data: confirmedBooking,
      });
    } catch (error: any) {
      console.error("Confirm booking error:", error);

      return res.status(500).json({
        success: false,
        message: "Gagal mengonfirmasi booking",
      });
    }
  };

  // ASSIGN EMPLOYEE (ADMIN)
  assignEmployee = async (req: Request, res: Response) => {
    try {
      const bookingId = Number(req.params.id);
      const { employeeId } = req.body;

      if (
        !Number.isInteger(bookingId) ||
        bookingId <= 0 ||
        !Number.isInteger(Number(employeeId)) ||
        Number(employeeId) <= 0
      ) {
        return res.status(400).json({
          success: false,
          message: "ID booking atau ID karyawan tidak valid",
        });
      }

      const [booking] = await db
        .select()
        .from(bookingsTable)
        .where(eq(bookingsTable.id, bookingId))
        .limit(1);

      if (!booking) {
        return res.status(404).json({
          success: false,
          message: "Booking tidak ditemukan",
        });
      }

      if (booking.status !== "confirmed") {
        return res.status(400).json({
          success: false,
          message: "Booking harus dikonfirmasi sebelum memilih karyawan",
        });
      }

      const [employee] = await db
        .select({
          id: usersTable.id,
          roleName: rolesTable.title,
        })
        .from(usersTable)
        .leftJoin(rolesTable, eq(usersTable.roleId, rolesTable.id))
        .where(eq(usersTable.id, Number(employeeId)))
        .limit(1);

      if (!employee || employee.roleName !== "Karyawan") {
        return res.status(404).json({
          success: false,
          message: "Akun karyawan tidak ditemukan",
        });
      }

      const [assignedBooking] = await db
        .update(bookingsTable)
        .set({
          employeeId: Number(employeeId),
          updatedAt: new Date(),
        })
        .where(eq(bookingsTable.id, bookingId))
        .returning();

      return res.status(200).json({
        success: true,
        message: "Karyawan berhasil ditugaskan",
        data: assignedBooking,
      });
    } catch (error: any) {
      console.error("Assign employee error:", error);

      return res.status(500).json({
        success: false,
        message: "Gagal memilih karyawan",
      });
    }
  };
}

export default new BookingGrooming();
