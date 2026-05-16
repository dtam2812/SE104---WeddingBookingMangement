import express from "express";
import {
  getAll,
  getById,
  create,
  update,
  remove,
} from "../Controllers/foodController.js";
import { authenticate, authorize } from "../Middleware/AuthMiddleware.js";

const foodRoutes = express.Router();

foodRoutes.get("/foods", getAll);
foodRoutes.get("/foods/:id", getById);
foodRoutes.post("/foods", authenticate, authorize("admin"), create);
foodRoutes.put("/foods/:id", authenticate, authorize("admin"), update);
foodRoutes.delete("/foods/:id", authenticate, authorize("admin"), remove);

export default foodRoutes;
