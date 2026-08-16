import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../config/db.js";

// 1. PUBLIC REGISTRATION (Users Only)
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({
        success: false,
        message: "Name, email, and password are required.",
      });
      return;
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      res.status(409).json({
        success: false,
        message: "Email is already registered.",
      });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Security Fix: Hardcoded role as 'USER'. Ignoring any 'role' sent in req.body
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "USER",
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    res.status(201).json({
      success: true,
      message: "User registered successfully.",
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to register user.",
      error: error instanceof Error ? error.message : error,
    });
  }
};

// 2. SECURE SINGLE ADMIN REGISTRATION
export const registerAdmin = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { name, email, password, adminSecret } = req.body;

    // Check 1: Verify System Admin Secret Key from .env
    const envAdminSecret = process.env.ADMIN_SECRET_KEY;
    if (!envAdminSecret || adminSecret !== envAdminSecret) {
      res.status(403).json({
        success: false,
        message: "Forbidden: Invalid admin registration secret.",
      });
      return;
    }

    // Check 2: Enforce Single Admin Constraint in Database
    const existingAdmin = await prisma.user.findFirst({
      where: { role: "ADMIN" },
    });

    if (existingAdmin) {
      res.status(400).json({
        success: false,
        message:
          "System limit reached: An Admin already exists. Only one Admin is allowed.",
      });
      return;
    }

    if (!name || !email || !password) {
      res.status(400).json({
        success: false,
        message: "Name, email, and password are required.",
      });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "ADMIN",
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    res.status(201).json({
      success: true,
      message: "Admin account created successfully.",
      data: admin,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create admin.",
      error: error instanceof Error ? error.message : error,
    });
  }
};

// 3. LOGIN CONTROLLER
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
      return;
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error(
        "[Auth Error]: JWT_SECRET is missing in environment variables."
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
      return;
    }

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      jwtSecret,
      { expiresIn: "1d" }
    );

    res.json({
      success: true,
      message: "Login successful.",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to login.",
      error: error instanceof Error ? error.message : error,
    });
  }
};