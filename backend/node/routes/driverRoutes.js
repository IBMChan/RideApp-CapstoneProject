// shriya : profile managemnet, ride history, payment history, vehicle management, dr_status management(online, offline) , register a complaint  
//chandana - wallet management
import express from 'express';
import { withdrawMoney } from '../controllers/driverController.js';

const router = express.Router();

router.post('/withdrawMoney', withdrawMoney);

<<<<<<< HEAD
export default router;
=======
export default router;
>>>>>>> upstream/main
