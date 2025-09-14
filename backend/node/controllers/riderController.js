//harshit and raksha // funcitonalities: 1. ride history 2. profile management(cloud image upload) 3. saved location (managing) 4. share status(twilio to whatsapp) 5. find a lost item/contact driver or previous rides/register a complaint
//chandana - wallet management 
//error handler
// backend/node/controllers/riderController.js
import riderService from "../services/riderService.js";
import { successResponse, errorResponse } from "../utils/apiResponse.js";

class RiderController {
  async addMoney(req, res) {
    try {
      const { rider_id } = req.params;
      const { amount } = req.body;
      const result = await riderService.addMoney(rider_id, amount);
      return successResponse(res, "Money added to wallet", result);
    } catch (err) {
      return errorResponse(res, err, err.statusCode || 400);
    }
  }
}

export default new RiderController();
