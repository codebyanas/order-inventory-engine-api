import { Router } from "express";
import {
  createOrder,
  getMyOrders,
  getOrderById,
  updateOrderStatus,
} from "../controllers/order.controller.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";

const router = Router();
router.use(authenticateToken);

router.post("/createOrder", createOrder);
router.get("/getMyOrders", getMyOrders);
router.get("/getOrderById/:id", getOrderById);
router.patch("/:id/statusUpdate", updateOrderStatus);

export default router;