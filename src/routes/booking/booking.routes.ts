import { Router } from "express";
import BookingGrooming from "../../controller/booking/booking.controller";
import { authenticate } from "../../middleware/auth.middleware";

const router = Router();

// USER
router.post("/" , authenticate, BookingGrooming.createBooking);

router.get("/" , authenticate, BookingGrooming.viewBooking);

router.patch( "/:id/cancel" , authenticate, BookingGrooming.cancelBooking);

// ADMIN
router.get("/admin" , authenticate, BookingGrooming.viewAllBooking);

router.patch("/:id/confirm" , authenticate, BookingGrooming.confirmBooking);

router.patch("/:id/assign" , authenticate, BookingGrooming.assignEmployee);

export default router;