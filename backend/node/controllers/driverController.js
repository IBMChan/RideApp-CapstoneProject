// shriya : profile managemnet, ride history, payment history, vehicle management, dr_status management(online, offline) , register a complaint  
//chandana - wallet management
// backend/node/controllers/driverController.js
import { withdrawMoney } from "../services/driverService.js";

export const withdrawMoneyFromWallet = async (req, res, next) => {
  try {
    const userId = req.user.user_id; // Assume auth middleware populates req.user
    const { amount, accountDetails } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    if (!accountDetails) {
      return res.status(400).json({ error: "Account details required" });
    }

    const result = await withdrawMoney(userId, amount, accountDetails);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};
