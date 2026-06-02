import express from "express";
import {
  getAll,
  getById,
  create,
  update,
  remove,
} from "../Controllers/foodTypeController.js";
import { authenticate, authorize } from "../Middleware/AuthMiddleware.js";

const foodTypeRoutes = express.Router();

foodTypeRoutes.get("/", getAll);
foodTypeRoutes.get("/:id", getById);
foodTypeRoutes.post("/", authenticate, authorize("admin"), create);
foodTypeRoutes.put("/:id", authenticate, authorize("admin"), update);
foodTypeRoutes.delete("/:id", authenticate, authorize("admin"), remove);

export default foodTypeRoutes;
