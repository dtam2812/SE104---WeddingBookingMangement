import express from "express";
import * as userController from "../Controllers/userController.js";
import * as hallTypeController from "../Controllers/hallTypeController.js";
import * as hallController from "../Controllers/hallController.js";
import * as foodController from "../Controllers/foodController.js";
import * as serviceController from "../Controllers/serviceController.js";
import * as ruleController from "../Controllers/ruleController.js";
import * as weddingController from "../Controllers/weddingController.js";
import * as invoiceController from "../Controllers/invoiceController.js";

const resourceRoutes = express.Router();

const controllerMap = {
  users: userController,
  "hall-types": hallTypeController,
  halls: hallController,
  foods: foodController,
  services: serviceController,
  rules: ruleController,
  weddings: weddingController,
  invoices: invoiceController,
};

// Generic CRUD routes
resourceRoutes.get("/:resource", (req, res) => {
  const controller = controllerMap[req.params.resource];
  if (!controller)
    return res.status(404).json({ message: "Resource not found" });
  controller.getAll(req, res);
});

resourceRoutes.post("/:resource", (req, res) => {
  const controller = controllerMap[req.params.resource];
  if (!controller)
    return res.status(404).json({ message: "Resource not found" });
  controller.create(req, res);
});

resourceRoutes.put("/:resource/:id", (req, res) => {
  const controller = controllerMap[req.params.resource];
  if (!controller)
    return res.status(404).json({ message: "Resource not found" });
  controller.update(req, res);
});

resourceRoutes.delete("/:resource/:id", (req, res) => {
  const controller = controllerMap[req.params.resource];
  if (!controller)
    return res.status(404).json({ message: "Resource not found" });
  controller.remove(req, res);
});

export default resourceRoutes;
