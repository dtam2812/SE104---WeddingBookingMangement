import express from "express";
import {
  getAll,
  create,
  update,
  remove,
} from "../Controllers/weddingController.js";
import { authenticate, authorize } from "../Middleware/AuthMiddleware.js";

const weddingRoutes = express.Router();

weddingRoutes.get("/", getAll);
weddingRoutes.post("/", create);
weddingRoutes.put("/:id", update);
weddingRoutes.delete("/:id", authenticate, authorize("admin"), remove);

export default weddingRoutes;
