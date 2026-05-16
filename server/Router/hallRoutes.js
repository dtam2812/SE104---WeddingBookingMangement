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

hallRoutes.get("/halls", getAll);
hallRoutes.get("/halls/available", getAvailable);
hallRoutes.get("/halls/:id", getById);
hallRoutes.post("/halls", authenticate, authorize("admin"), create);
hallRoutes.put("/halls/:id", authenticate, authorize("admin"), update);
hallRoutes.delete("/halls/:id", authenticate, authorize("admin"), remove);

export default hallRoutes;
