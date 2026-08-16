import { Response } from "express";
import { prisma } from "../config/db.js";
import { AuthenticatedRequest } from "../middlewares/auth.middleware.js";

interface OrderItemInput {
  productId: number;
  quantity: number;
}

// CREATE ORDER (100% Safe Atomic Transaction & Zero Negative Stock)
export const createOrder = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized access." });
      return;
    }

    const { items }: { items: OrderItemInput[] } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({
        success: false,
        message: "Order must contain at least one item.",
      });
      return;
    }

    // Atomic Transaction: All or Nothing
    const result = await prisma.$transaction(async (tx) => {
      let totalAmount = 0;
      const orderItemsData = [];

      for (const item of items) {
        const productId = Number(item.productId);
        const quantity = Number(item.quantity);

        if (!productId || !quantity || quantity <= 0) {
          throw new Error("Invalid productId or quantity.");
        }

        // STEP 1: Atomic Stock Decrement at DB level
        // 'gte: quantity' guarantees stock will NEVER go below 0 (-1, -2 etc.)
        const stockUpdateResult = await tx.product.updateMany({
          where: {
            id: productId,
            stock: {
              gte: quantity, // Only update if stock is greater than or equal to requested quantity
            },
          },
          data: {
            stock: {
              decrement: quantity, // Atomic subtract
            },
          },
        });

        // STEP 2: Check if DB successfully updated the stock
        // If count === 0, either product doesn't exist OR stock is insufficient
        if (stockUpdateResult.count === 0) {
          const product = await tx.product.findUnique({
            where: { id: productId },
            select: { title: true, stock: true },
          });

          if (!product) {
            throw new Error(`Product with ID ${productId} does not exist.`);
          } else {
            throw new Error(
              `Out of stock! '${product.title}' has only ${product.stock} items available.`,
            );
          }
        }

        // STEP 3: Fetch Product Price for accurate total calculation
        const product = await tx.product.findUnique({
          where: { id: productId },
          select: { id: true, price: true },
        });

        if (!product) {
          throw new Error("Product details not found.");
        }

        const itemTotal = product.price * quantity;
        totalAmount += itemTotal;

        orderItemsData.push({
          productId: product.id,
          quantity,
          price: product.price,
        });
      }

      // STEP 4: Create Order with Items
      const newOrder = await tx.order.create({
        data: {
          userId,
          total: totalAmount, 
          status: "PENDING",
          items: {
            create: orderItemsData,
          },
        },
        include: {
          items: {
            include: {
              product: {
                select: { id: true, title: true, price: true },
              },
            },
          },
        },
      });

      return newOrder;
    });

    res.status(201).json({
      success: true,
      message: "Order placed successfully.",
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to create order.",
    });
  }
};

// 2. GET USER ORDER HISTORY (Logged-in user's orders)
export const getMyOrders = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized access." });
      return;
    }

    const orders = await prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        items: {
          include: {
            product: {
              select: { id: true, title: true },
            },
          },
        },
      },
    });

    res.json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch orders.",
      error: error instanceof Error ? error.message : error,
    });
  }
};

// 3. GET ORDER BY ID (Detailed breakdown)
export const getOrderById = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const userRole = req.user?.role;
    const orderId = Number(req.params.id);

    if (isNaN(orderId)) {
      res.status(400).json({ success: false, message: "Invalid order ID." });
      return;
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        items: {
          include: {
            product: {
              select: { id: true, title: true, price: true },
            },
          },
        },
      },
    });

    if (!order) {
      res.status(404).json({ success: false, message: "Order not found." });
      return;
    }

    // Security check: Only order owner or Admin can view
    if (order.userId !== userId && userRole !== "ADMIN") {
      res.status(403).json({
        success: false,
        message: "Access denied. You can only view your own orders.",
      });
      return;
    }

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch order details.",
      error: error instanceof Error ? error.message : error,
    });
  }
};
