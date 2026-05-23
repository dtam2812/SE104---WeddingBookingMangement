import express from "express";
import {
  getAll,
  getById,
  create,
  update,
  remove,
  getRevenueReport,
} from "../Controllers/invoiceController.js";
import { authenticate, authorize } from "../Middleware/AuthMiddleware.js";

const invoiceRoutes = express.Router();

invoiceRoutes.get("/", getAll);
invoiceRoutes.get("/revenue", getRevenueReport);
invoiceRoutes.get("/:id", getById);
invoiceRoutes.post("/", create);
invoiceRoutes.put("/:id", update);
invoiceRoutes.delete("/:id", authenticate, authorize("admin"), remove);

export default invoiceRoutes;
