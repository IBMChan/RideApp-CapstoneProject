// shriya : profile managemnet, ride history, payment history, vehicle management, dr_status management(online, offline) , register a complaint  
//chandana - wallet management
import { withdrawMoneyService } from '../services/driverService.js';

export const withdrawMoney = async (req, res) => {
    try {
        const { user_id, amount, payment_method, bank_details } = req.body;

        const result = await withdrawMoneyService({ user_id, amount, payment_method, bank_details });
        res.status(200).json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


// Updated something