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

hallTypeRoutes.get("/hall-types", getAll);
hallTypeRoutes.get("/hall-types/:id", getById);
hallTypeRoutes.post("/hall-types", authenticate, authorize("admin"), create);
hallTypeRoutes.put("/hall-types/:id", authenticate, authorize("admin"), update);
hallTypeRoutes.delete(
  "/hall-types/:id",
  authenticate,
  authorize("admin"),
  remove,
);

export default hallTypeRoutes;
