import { Request, Response } from "express";
import { prisma } from "../config/db.js";

// 1. GET All Products (With Pagination, Search & Sorting)
export const getProducts = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const search = (req.query.search as string) || "";
    const sort = (req.query.sort as string) === "asc" ? "asc" : "desc";

    const skip = (page - 1) * limit;

    const where = search
      ? {
          title: {
            contains: search,
          },
        }
      : {};

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: sort,
        },
      }),
      prisma.product.count({ where }),
    ]);

    res.json({
      success: true,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      data: products,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error in products fetch",
      error: error instanceof Error ? error.message : error,
    });
  }
};

// 2. GET Single Product Details by ID
export const getProductById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const id = Number(req.params.id);

    if (isNaN(id)) {
      res.status(400).json({ success: false, message: "Invalid product ID." });
      return;
    }

    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      res.status(404).json({ success: false, message: "Product not found." });
      return;
    }

    res.json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch product.",
      error: error instanceof Error ? error.message : error,
    });
  }
};

// 3. CREATE Product (Admin Only)
export const createProduct = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { title, price, stock } = req.body;

    if (!title || price === undefined || stock === undefined) {
      res.status(400).json({
        success: false,
        message: "Title, price, and stock are required.",
      });
      return;
    }

    const newProduct = await prisma.product.create({
      data: {
        title,
        price: Number(price),
        stock: Number(stock),
      },
    });

    res.status(201).json({
      success: true,
      message: "Product created successfully.",
      data: newProduct,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create product.",
      error: error instanceof Error ? error.message : error,
    });
  }
};

// 4. UPDATE Product (Admin Only)
export const updateProduct = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const { title, price, stock } = req.body;

    if (isNaN(id)) {
      res.status(400).json({ success: false, message: "Invalid product ID." });
      return;
    }

    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      res.status(404).json({ success: false, message: "Product not found." });
      return;
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(price !== undefined && { price: Number(price) }),
        ...(stock !== undefined && { stock: Number(stock) }),
      },
    });

    res.json({
      success: true,
      message: "Product updated successfully.",
      data: updatedProduct,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update product.",
      error: error instanceof Error ? error.message : error,
    });
  }
};

// 5. DELETE Product (Admin Only)
export const deleteProduct = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const id = Number(req.params.id);

    if (isNaN(id)) {
      res.status(400).json({ success: false, message: "Invalid product ID." });
      return;
    }

    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      res.status(404).json({ success: false, message: "Product not found." });
      return;
    }

    await prisma.product.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: "Product deleted successfully.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete product.",
      error: error instanceof Error ? error.message : error,
    });
  }
};