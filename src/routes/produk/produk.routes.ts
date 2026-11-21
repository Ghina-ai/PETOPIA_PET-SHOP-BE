import { Router } from "express";
import ProductsController from "../../controller/produk/produk.controller";
import { uploadSingleImage } from "../../middleware/upload.middleware";
import { authenticate } from "../../middleware/auth.middleware";
import { isAdmin } from "../../middleware/isAdmin";

const router = Router();

// CREATE PRODUCT
router.post("/" , authenticate, isAdmin, uploadSingleImage, ProductsController.createProduct);

// GET ALL PRODUCTS
router.get("/", ProductsController.getAllProducts);

// GET PRODUCT BY ID
router.get("/:id", ProductsController.getProductById);

// UPDATE PRODUCT
router.patch( "/:id", authenticate, isAdmin, uploadSingleImage, ProductsController.updateProduct);

// DELETE PRODUCT
router.delete("/:id", authenticate, isAdmin, ProductsController.deleteProduct);

export default router;
