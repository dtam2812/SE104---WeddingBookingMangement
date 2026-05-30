import express from "express";
import { login, resetPassword } from "../Controllers/authController.js";
import { authenticate, authorize } from "../Middleware/AuthMiddleware.js";

const authRoutes = express.Router();

authRoutes.post("/login", login);
authRoutes.post("/resetPassword", resetPassword);

export default authRoutes;
