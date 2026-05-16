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
invoiceRoutes.get("/invoices", getAll);
invoiceRoutes.get("/invoices/revenue", getRevenueReport);
invoiceRoutes.get("/invoices/:id", getById);
invoiceRoutes.post("/invoices", create);
invoiceRoutes.put("/invoices/:id", update);
invoiceRoutes.delete("/invoices/:id", authenticate, authorize("admin"), remove);

export default invoiceRoutes;
