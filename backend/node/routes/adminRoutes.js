import { Router } from "express";
import adminController from "../controllers/adminController.js";

const router = Router();

router.get("/rides", (req, res) => adminController.getAllRides(req, res));
router.get("/rides/:ride_id", (req, res) => adminController.getRide(req, res));
router.patch("/rides/:ride_id", (req, res) => adminController.updateRide(req, res));
router.delete("/rides/:ride_id", (req, res) => adminController.deleteRide(req, res));
router.get("/stats", (req, res) => adminController.getStats(req, res));

export default router;
