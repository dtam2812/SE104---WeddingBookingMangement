import express from "express";
import { getAvailable } from "../Controllers/hallController.js";

const hallRoutes = express.Router();

hallRoutes.get("/available", getAvailable);

export default hallRoutes;
