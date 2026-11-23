import { Router } from "express";
import GroomingController from "../../controller/grooming/grooming.controller";
import { authenticate } from "../../middleware/auth.middleware";
import { isAdmin } from "../../middleware/isAdmin";
import { uploadSingleImage } from "../../middleware/upload.middleware";

const router = Router();

// CREATE GROOMING
router.post("/", authenticate, isAdmin, uploadSingleImage, GroomingController.createGrooming);

// GET ALL GROOMING
router.get("/", GroomingController.getAllGrooming);

// GET GROOMING BY ID
router.get("/:id", GroomingController.getGroomingById);

// UPDATE GROOMING
router.patch( "/:id", authenticate, isAdmin, uploadSingleImage, GroomingController.updateGrooming);

// DELETE GROOMING
router.delete("/:id", authenticate, isAdmin, GroomingController.deleteGrooming);

export default router;
