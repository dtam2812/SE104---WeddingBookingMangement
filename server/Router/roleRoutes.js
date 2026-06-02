import express from "express";
import {
  getAll,
  getById,
  create,
  update,
  remove,
} from "../Controllers/roleController.js";
import { authenticate, authorize } from "../Middleware/AuthMiddleware.js";

const roleRoutes = express.Router();

roleRoutes.get("/", getAll);
roleRoutes.get("/:id", getById);
roleRoutes.post("/", authenticate, authorize("admin"), create);
roleRoutes.put("/:id", authenticate, authorize("admin"), update);
roleRoutes.delete("/:id", authenticate, authorize("admin"), remove);

export default roleRoutes;
