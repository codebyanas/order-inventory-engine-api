import { Router } from "express";
import {
  createOrder,
  getMyOrders,
  getOrderById,
} from "../controllers/order.controller.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";

const router = Router();

// Sub routes protected using authenticateToken middleware
router.use(authenticateToken);

router.post("/", createOrder);
router.get("/", getMyOrders);
router.get("/:id", getOrderById);

export default router;