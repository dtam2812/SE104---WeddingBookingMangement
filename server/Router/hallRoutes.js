import express from "express";
import {
  getAll,
  getById,
  getAvailable,
  create,
  update,
  remove,
} from "../Controllers/hallController.js";
import { authenticate, authorize } from "../Middleware/AuthMiddleware.js";

const hallRoutes = express.Router();

hallRoutes.get("/", getAll);
hallRoutes.get("/available", getAvailable);
hallRoutes.get("/:id", getById);
hallRoutes.post("/", authenticate, authorize("admin"), create);
hallRoutes.put("/:id", authenticate, authorize("admin"), update);
hallRoutes.delete("/:id", authenticate, authorize("admin"), remove);

export default hallRoutes;
