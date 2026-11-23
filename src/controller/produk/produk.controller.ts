import { Request, Response } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";
import { db } from "../../config/db";
import { and, desc, eq, getTableColumns } from "drizzle-orm";
import { productsTable, categoriesTable } from "../../config/schema";
import { uploadToCloudinary } from "../../services/cloudinary.services";
import {createProductSchema,productIdSchema,updateProductParamsSchema,updateProductSchema,} from "../../validation/produk.validation";
import cloudinary from "../../config/cloudinary";

export class ProductsController {
  // CREATE PRODUCT
  createProduct = async (req: AuthRequest, res: Response) => {
    try {
      const validatedData = createProductSchema.parse(req.body);

      const { name, categoryId, price, stock, description } = validatedData;

      const userId = req.user!.id;

      // CEK KATEGORI
      const category = await db.query.categoriesTable.findFirst({
        where: eq(categoriesTable.id, categoryId),
      });

      if (!category) {
        return res.status(404).json({
          success: false,
          message: "Category not found",
        });
      }

      let imageUrl: string | undefined;
      let imagePublicId: string | undefined;

      // UPLOAD IMAGE
      if (req.file) {
        const uploadResult = await uploadToCloudinary(req.file.buffer);
        imageUrl = uploadResult.secure_url;
        imagePublicId = uploadResult.public_id;
      }

      // INSERT PRODUCT
      const [insertedProduct] = await db
        .insert(productsTable)
        .values({
          userId,
          name,
          categoryId,
          price: String(price),
          stock,
          description,
          image: imageUrl,
          imagePublicId,
        })
        .returning();

      return res.status(201).json({
        success: true,
        message: "Product created successfully",
        data: {
          product: insertedProduct,
        },
      });
    } catch (error: any) {
      console.error("create product error:", error);
      return res.status(500).json({
        success: false,
        message: "Terjadi kesalahan pada server",
        error: error instanceof Error ? error.message : error,
      });
    }
  };

  // GET ALL PUBLISHED PRODUCTS
  getAllProducts = async (req: Request, res: Response) => {
    try {
      const products = await db
        .select({
          ...getTableColumns(productsTable),
          categoryName: categoriesTable.name,
        })
        .from(productsTable)
        .leftJoin(
          categoriesTable,
          eq(productsTable.categoryId, categoriesTable.id),
        )
        .where(eq(productsTable.status, "published"))
        .orderBy(desc(productsTable.createdAt));

      return res.status(200).json({
        success: true,
        message: "Get products successfully",
        data: {
          products,
        },
      });
    } catch (error: any) {
      console.error("get all products error:", error);

      return res.status(500).json({
        success: false,
        message: "Terjadi kesalahan pada server",
        error: error instanceof Error ? error.message : error,
      });
    }
  };

  // GET PRODUCT BY ID
  getProductById = async (req: Request, res: Response) => {
    try {
      const validatedParams = productIdSchema.parse(req.params);
      const { id } = validatedParams;

      const [product] = await db
        .select({
          ...getTableColumns(productsTable),
          categoryName: categoriesTable.name,
        })

        .from(productsTable)
        .leftJoin(
          categoriesTable,
          eq(productsTable.categoryId, categoriesTable.id),
        )
        .where(
          and(eq(productsTable.id, id), eq(productsTable.status, "published")),
        );

      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Product not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Product retrieved successfully",
        data: {
          product,
        },
      });
    } catch (error: any) {
      console.error("get product by id error:", error);

      return res.status(500).json({
        success: false,
        message: "Terjadi kesalahan pada server",
        error: error instanceof Error ? error.message : error,
      });
    }
  };

  // UPDATE PRODUCT
  updateProduct = async (req: Request, res: Response) => {
    try {
      // VALIDATE PARAMS
      const validatedParams = updateProductParamsSchema.parse(req.params);
      const { id } = validatedParams;

      // VALIDATE BODY
      const validatedData = updateProductSchema.parse(req.body);

      const { name, categoryId, price, stock, description } = validatedData;

      // CEK PRODUCT
      const existingProduct = await db.query.productsTable.findFirst({
        where: eq(productsTable.id, id),
      });

      if (!existingProduct) {
        return res.status(404).json({
          success: false,
          message: "Product not found",
        });
      }

      // CEK KATEGORI JIKA DIUPDATE
      if (categoryId !== undefined) {
        const category = await db.query.categoriesTable.findFirst({
          where: eq(categoriesTable.id, categoryId),
        });

        if (!category) {
          return res.status(404).json({
            success: false,
            message: "Category not found",
          });
        }
      }

      // SIAPKAN IMAGE
      let imageUrl = existingProduct.image;
      let imagePublicId = existingProduct.imagePublicId;

      if (req.file) {
        const uploadResult = await uploadToCloudinary(req.file.buffer);

        imageUrl = uploadResult.secure_url;
        imagePublicId = uploadResult.public_id;
      }

      // UPDATE DATABASE
      await db
        .update(productsTable)
        .set({
          ...(name !== undefined && { name }),
          ...(categoryId !== undefined && { categoryId }),
          ...(price !== undefined && { price: String(price) }),
          ...(stock !== undefined && { stock }),
          ...(description !== undefined && { description }),
          ...(req.file && {
            image: imageUrl,
            imagePublicId,
          }),
        })
        .where(eq(productsTable.id, id));

      // AMBIL DATA TERBARU
      const [updatedProduct] = await db
        .select({
          ...getTableColumns(productsTable),
          categoryName: categoriesTable.name,
        })
        .from(productsTable)
        .leftJoin(
          categoriesTable,
          eq(productsTable.categoryId, categoriesTable.id),
        )
        .where(eq(productsTable.id, id));

      return res.status(200).json({
        success: true,
        message: "Product updated successfully",
        data: {
          product: updatedProduct,
        },
      });
    } catch (error: any) {
      console.error("update product error:", error);

      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : error,
      });
    }
  };

  // DELETE PRODUCT
    deleteProduct = async (req: AuthRequest, res: Response) => {
    try {
      const productId = Number(req.params.id);

      const [product] = await db
        .select()
        .from(productsTable)
        .where(eq(productsTable.id, productId));

      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Produk tidak ditemukan",
        });
      }

      // Hapus foto dari Cloudinary jika ada
      if (product.imagePublicId) {
        await cloudinary.uploader.destroy(product.imagePublicId);
      }

      // Hapus produk dari database
      await db
        .delete(productsTable)
        .where(eq(productsTable.id, productId));

      return res.status(200).json({
        success: true,
        message: "Produk berhasil dihapus",
      });
    } catch (error: any) {
      console.error("Delete Product Error:", error);

      return res.status(500).json({
        success: false,
        message: "Terjadi kesalahan pada server",
        error: error instanceof Error ? error.message : error,
      });
    }
  };
}

export default new ProductsController();
