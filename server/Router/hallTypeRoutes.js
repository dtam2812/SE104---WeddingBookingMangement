import express from "express";
import {
  getAll,
  getById,
  create,
  update,
  remove,
} from "../Controllers/hallTypeController.js";
import { authenticate, authorize } from "../Middleware/AuthMiddleware.js";

const hallTypeRoutes = express.Router();

hallTypeRoutes.get("/", getAll);
hallTypeRoutes.get("/:id", getById);
hallTypeRoutes.post("/", authenticate, authorize("admin"), create);
hallTypeRoutes.put("/:id", authenticate, authorize("admin"), update);
hallTypeRoutes.delete("/:id", authenticate, authorize("admin"), remove);

export default hallTypeRoutes;
