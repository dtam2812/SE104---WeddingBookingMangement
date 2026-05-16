import express from "express";
import { login } from "../Controllers/authController.js";
import {
  getAvailableHalls,
  getRevenueReport,
  getAll,
  create,
  update,
  remove,
} from "../Controllers/resourceController.js";

const router = express.Router();

router.post("/auth/login", login);
router.get("/halls/available", getAvailableHalls);
router.get("/reports/revenue", getRevenueReport);

router.get("/:resource", getAll);
router.post("/:resource", create);
router.put("/:resource/:id", update);
router.delete("/:resource/:id", remove);

export default router;
