// backend/services/paymentService.js
import paymentRepository from "../repositories/mongodb/paymentRepository.js";

class PaymentService {
  // Create a payment for a ride (or return existing)
  async createPaymentForRide({ ride_id, fare, mode = "cash" }) {
    // Mode validation (we only handle cash/upi here)
    if (!["cash", "upi"].includes(mode)) {
      throw new Error("Unsupported mode for this flow. Use 'cash' or 'upi'.");
    }
    // ensure doc exists
    return await paymentRepository.ensureForRide(ride_id, fare, mode);
  }

  async getPaymentByRide(ride_id) {
    return await paymentRepository.findByRideId(ride_id);
  }

  async confirmPaymentByDriver(payment_id, driver_user_id) {
    const payment = await paymentRepository.findById(payment_id);
    if (!payment) throw new Error("Payment not found");
    if (payment.status === "success") {
      return payment; // already confirmed
    }

    const updated = await paymentRepository.updateStatus(payment_id, {
      status: "success",
      Payed_At: new Date(),
      confirmed_by: driver_user_id, // optional audit field
    });
    return updated;
  }
}

export default new PaymentService();
