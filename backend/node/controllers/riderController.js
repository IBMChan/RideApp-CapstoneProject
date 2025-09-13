//harshit and raksha // funcitonalities: 1. ride history 2. profile management(cloud image upload) 3. saved location (managing) 4. share status(twilio to whatsapp) 5. find a lost item/contact driver or previous rides/register a complaint
//chandana - wallet management 
//error handler
import { addMoneyService } from '../sevices/riderService.js';

export const addMoney = async (req, res) => {
    try {
        const { user_id, amount, payment_method, bank_details } = req.body;

        const result = await addMoneyService({ user_id, amount, payment_method, bank_details });
        res.status(200).json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
