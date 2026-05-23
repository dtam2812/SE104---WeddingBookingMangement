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

ruleRoutes.get("/", getAll);
ruleRoutes.get("/:code", getByCode);
ruleRoutes.post("/", authenticate, authorize("admin"), create);
ruleRoutes.put("/:id", authenticate, authorize("admin"), update);
ruleRoutes.delete("/:id", authenticate, authorize("admin"), remove);

export default ruleRoutes;
