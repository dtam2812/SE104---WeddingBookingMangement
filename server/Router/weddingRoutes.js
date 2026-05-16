import express from "express";
import {
  getAll,
  create,
  update,
  remove,
} from "../Controllers/weddingController.js";
import { authenticate, authorize } from "../Middleware/AuthMiddleware.js";

const weddingRoutes = express.Router();

weddingRoutes.get("/weddings", getAll);
weddingRoutes.post("/weddings", create);
weddingRoutes.put("/weddings/:id", update);
weddingRoutes.delete("/weddings/:id", authenticate, authorize("admin"), remove);

export default weddingRoutes;
