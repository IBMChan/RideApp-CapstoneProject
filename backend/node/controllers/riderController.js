//harshit and raksha // funcitonalities: 1. ride history 2. profile management(cloud image upload) 3. saved location (managing) 4. share status(twilio to whatsapp) 5. find a lost item/contact driver or previous rides/register a complaint
//chandana - wallet management 
//error handler
// backend/node/controllers/riderController.js
import { addMoney } from "../services/riderService.js";

export const addMoneyToWallet = async (req, res, next) => {
  try {
    // Use req.body.user_id for testing instead of req.user.user_id
    const userId = req.body.user_id;
    const { amount, accountDetails } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "user_id is required for testing" });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    if (!accountDetails) {
      return res.status(400).json({ error: "Account details required" });
    }

    const result = await addMoney(userId, amount, accountDetails);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};
