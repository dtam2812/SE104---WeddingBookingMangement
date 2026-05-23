import express from "express";
import { login } from "../Controllers/authController.js";
import { authenticate, authorize } from "../Middleware/AuthMiddleware.js";

const authRoutes = express.Router();

authRoutes.post("/login", login);

export default authRoutes;
