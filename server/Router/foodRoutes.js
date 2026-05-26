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

foodRoutes.get("/", getAll);
foodRoutes.get("/:id", getById);
foodRoutes.post("/", authenticate, authorize("admin"), create);
foodRoutes.put("/:id", authenticate, authorize("admin"), update);
foodRoutes.delete("/:id", authenticate, authorize("admin"), remove);

export default foodRoutes;
