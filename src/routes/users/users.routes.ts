import { Router } from "express";
import UserController from "../../controller/users/users.controller";
import { authenticate } from "../../middleware/auth.middleware";
import { uploadSingleImage } from "../../middleware/upload.middleware";

const router = Router();

// USER : GET PROFILE
router.get("/profile", authenticate, UserController.getProfile);

// USER : UPDATE PROFILE
router.patch("/profile", authenticate, uploadSingleImage, UserController.updateProfile);

export default router;
