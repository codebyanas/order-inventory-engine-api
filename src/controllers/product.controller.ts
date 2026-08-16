import { Request, Response } from "express";
import { prisma } from "../config/db.js";

export const getProducts = async (req: Request, res: Response) => {
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
      message: "Products fetch karne mein error aaya.",
      error: error instanceof Error ? error.message : error,
    });
  }
};