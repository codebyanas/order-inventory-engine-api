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

router.post("/createOrder", createOrder);
router.get("/getMyOrders", getMyOrders);
router.get("/getOrderById/:id", getOrderById);

export default router;