import express from "express";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import productRoutes from "./routes/product.routes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

// Routes Mount
app.use("/api/products", productRoutes);

// Database Connect then Start Server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});