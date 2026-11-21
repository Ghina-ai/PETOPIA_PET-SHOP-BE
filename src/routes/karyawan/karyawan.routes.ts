import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import karyawanController from "../../controller/karyawan/karyawan.controller";
import { isAdmin } from "../../middleware/isAdmin";

const router = Router();

router.post( "/register", authenticate, isAdmin, karyawanController.createKaryawan);

export default router;