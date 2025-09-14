import express from "express";
import riderController from "../controllers/riderController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/:rider_id/wallet/add-money", authMiddleware, riderController.addMoney);

export default router;
