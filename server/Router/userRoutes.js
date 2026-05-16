import express from "express";
import {
  getAll,
  getById,
  create,
  update,
  remove,
} from "../Controllers/userController.js";
import { authenticate, authorize } from "../Middleware/AuthMiddleware.js";

const userRoutes = express.Router();

userRoutes.get("/users", authenticate, authorize("admin"), getAll);
userRoutes.get("/users/:id", authenticate, authorize("admin"), getById);
userRoutes.post("/users", authenticate, authorize("admin"), create);
userRoutes.put("/users/:id", authenticate, authorize("admin"), update);
userRoutes.delete("/users/:id", authenticate, authorize("admin"), remove);

export default userRoutes;
