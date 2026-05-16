import express from "express";
import mongoose from "mongoose";
import cors from "cors"; // Thêm CORS để Frontend gọi được API
import dotenv from "dotenv";
import { seedDatabase } from "./Services/seed.js";
import apiRouter from "./Router/routes.js";
import { logger } from "./Middleware/logger.js";

dotenv.config();

const DB_URL =
  process.env.DB_URL ||
  "mongodb+srv://nguyenductam98765_db_user:dtam2812@cluster0.rhi4hs0.mongodb.net/WeddingManagement";

mongoose
  .connect(DB_URL)
  .then(() => console.log("Connected to MongoDB Atlas"))
  .catch((err) => console.error("MongoDB connection error:", err));

async function startServer() {
  // Chạy hàm tạo dữ liệu mẫu nếu DB trống
  await seedDatabase();

  const app = express();
  // Lấy PORT từ file .env (5000), nếu không có thì dùng 5000
  const PORT = process.env.PORT || 5000;

  // Middleware
  app.use(cors()); // Cho phép Frontend kết nối tới
  app.use(express.json()); // Đọc dữ liệu JSON từ request
  app.use(logger); // Log các request ra terminal

  // API Routes
  app.use("/api", apiRouter);

  // Khởi động server
  app.listen(PORT, () => {
    console.log(`Server Backend đang chạy tại: http://localhost:${PORT}`);
  });
}

startServer();
