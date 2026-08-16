import { Router } from "express";
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/product.controller.js";
import {
  authenticateToken,
  requireAdmin,
} from "../middlewares/auth.middleware.js";

const router = Router();

// Public Routes
router.get("/", getProducts);
router.get("/:id", getProductById);

// Admin Protected Routes
router.post("/createProduct/", authenticateToken, requireAdmin, createProduct);
router.put("/updateProduct/:id", authenticateToken, requireAdmin, updateProduct);
router.delete("/deleteProduct/:id", authenticateToken, requireAdmin, deleteProduct);

export default router;