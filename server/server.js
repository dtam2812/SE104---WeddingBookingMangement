import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import { connectDatabase } from "./Services/connectDbService.js";
import authRoutes from "./Router/authRoutes.js";
import weddingRoutes from "./Router/weddingRoutes.js";
import invoiceRoutes from "./Router/invoiceRoutes.js";
import userRoutes from "./Router/userRoutes.js";
import serviceRoutes from "./Router/serviceRoutes.js";
import foodRoutes from "./Router/foodRoutes.js";
import hallRoutes from "./Router/hallRoutes.js";
import hallTypeRoutes from "./Router/hallTypeRoutes.js";
import ruleRoutes from "./Router/ruleRoutes.js";

async function startServer() {
  await connectDatabase();

  const app = express();
  const PORT = process.env.PORT || 5000;

  app.use(
    cors({
      origin: process.env.CLIENT_URL || "*",
      methods: ["GET", "POST", "PUT", "DELETE"],
    }),
  );
  app.use(express.json());

  app.use("/api/auth", authRoutes);
  app.use("/api/weddings", weddingRoutes);
  app.use("/api/invoices", invoiceRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/services", serviceRoutes);
  app.use("/api/foods", foodRoutes);
  app.use("/api/halls", hallRoutes);
  app.use("/api/hall-types", hallTypeRoutes);
  app.use("/api/rules", ruleRoutes);

  app.use((req, res) => {
    res.status(404).json({
      success: false,
      message: `Route ${req.method} ${req.path} không tồn tại!`,
    });
  });

  app.use((err, req, res, next) => {
    console.error("Unhandled error:", err);
    res.status(500).json({ success: false, message: "Lỗi server!" });
  });

  app.listen(PORT, () => {
    console.log(`Server đang chạy tại: http://localhost:${PORT}`);
  });
}

startServer();
