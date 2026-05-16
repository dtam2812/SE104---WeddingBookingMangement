import express from "express";
import {
  getAll,
  getByCode,
  create,
  update,
  remove,
} from "../Controllers/ruleController.js";
import { authenticate, authorize } from "../Middleware/AuthMiddleware.js";

const ruleRoutes = express.Router();

ruleRoutes.get("/rules", getAll);
ruleRoutes.get("/rules/:code", getByCode);
ruleRoutes.post("/rules", authenticate, authorize("admin"), create);
ruleRoutes.put("/rules/:id", authenticate, authorize("admin"), update);
ruleRoutes.delete("/rules/:id", authenticate, authorize("admin"), remove);

export default ruleRoutes;
