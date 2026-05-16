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

serviceRoutes.get("/services", getAll);
serviceRoutes.get("/services/:id", getById);
serviceRoutes.post("/services", authenticate, authorize("admin"), create);
serviceRoutes.put("/services/:id", authenticate, authorize("admin"), update);
serviceRoutes.delete("/services/:id", authenticate, authorize("admin"), remove);

export default serviceRoutes;
