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

userRoutes.get("/", authenticate, authorize("admin"), getAll);
userRoutes.get("/:id", authenticate, authorize("admin"), getById);
userRoutes.post("/", authenticate, authorize("admin"), create);
userRoutes.put("/:id", authenticate, authorize("admin"), update);
userRoutes.delete("/:id", authenticate, authorize("admin"), remove);

export default userRoutes;
