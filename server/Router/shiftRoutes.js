import express from "express";
import {
  getAll,
  getById,
  create,
  update,
  remove,
} from "../Controllers/shiftController.js";
import { authenticate, authorize } from "../Middleware/AuthMiddleware.js";

const shiftRoutes = express.Router();

shiftRoutes.get("/", getAll);
shiftRoutes.get("/:id", getById);
shiftRoutes.post("/", authenticate, authorize("admin"), create);
shiftRoutes.put("/:id", authenticate, authorize("admin"), update);
shiftRoutes.delete("/:id", authenticate, authorize("admin"), remove);

export default shiftRoutes;
