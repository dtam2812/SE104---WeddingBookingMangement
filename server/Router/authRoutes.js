import express from "express";
import { login } from "../Controllers/authController.js";

const authRoutes = express.Router();

authRoutes.post("/login", login);

export default authRoutes;
