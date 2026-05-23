import express from "express";
import {
  getAll,
  getById,
  create,
  update,
  remove,
} from "../Controllers/serviceController.js";
import { authenticate, authorize } from "../Middleware/AuthMiddleware.js";

const serviceRoutes = express.Router();

serviceRoutes.get("/", getAll);
serviceRoutes.get("/:id", getById);
serviceRoutes.post("/", authenticate, authorize("admin"), create);
serviceRoutes.put("/:id", authenticate, authorize("admin"), update);
serviceRoutes.delete("/:id", authenticate, authorize("admin"), remove);

export default serviceRoutes;
