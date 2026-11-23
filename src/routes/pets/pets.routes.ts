import { Router } from "express";
import PetsController from "../../controller/pets/pets.controller";
import { authenticate } from "../../middleware/auth.middleware";
import { uploadSingleImage } from "../../middleware/upload.middleware";

const router = Router();

//CREATE
router.post("/", authenticate, uploadSingleImage, PetsController.createPet);

//ALL
router.get("/", authenticate, PetsController.getMyPets);

//BY ID
router.get("/:id", authenticate, PetsController.getPetById);

//UPDATE
router.patch("/:id", authenticate, uploadSingleImage, PetsController.updatePet);

//DELETE
router.delete("/:id", authenticate, PetsController.deletePet);

export default router;
