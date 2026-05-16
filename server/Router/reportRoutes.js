import express from "express";
import { getRevenueReport } from "../Controllers/invoiceController.js";

const reportRoutes = express.Router();

reportRoutes.get("/revenue", getRevenueReport);

export default reportRoutes;
