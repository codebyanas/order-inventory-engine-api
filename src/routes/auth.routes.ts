import { Router } from "express";
import {
  register,
  registerAdmin,
  login,
} from "../controllers/auth.controller.js";

const router = Router();

router.post("/register", register);
router.post("/register-admin", registerAdmin);
router.post("/login", login);

export default router;