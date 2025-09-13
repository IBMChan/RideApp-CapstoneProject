//harshit and raksha // funcitonalities: 1. ride history 2. profile management(cloud image upload) 3. saved location (managing) 4. share status(twilio to whatsapp) 5. find a lost item/contact driver or previous rides/register a complaint
//chandana - wallet management 
//error handler
import express from 'express';
import { addMoney } from '../controllers/riderController.js';

const router = express.Router();

router.post('/addMoney', addMoney);

export default router;
