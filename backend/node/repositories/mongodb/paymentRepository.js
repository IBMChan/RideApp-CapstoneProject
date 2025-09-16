// backend/node/repositories/mongodb/paymentRepository.js
import Payment from "../../entities/paymentModel.js";

class PaymentRepository {
  async create({ ride_id, fare, mode }) {
    const p = new Payment({ ride_id, fare, mode, status: "pending" });
    return p.save();
  }

  async findByRide(ride_id) {
    return Payment.findOne({ ride_id });
  }

  async findByMode(mode) {
  return Payment.find({ mode }).lean();
}

  
  async findById(payment_id) {
    return Payment.findOne({ payment_id: payment_id });
  }

    async findAll() {
    return Payment.find().lean();
  }

  async updateByPaymentId(payment_id, data) {
    return Payment.findOneAndUpdate({ payment_id }, data, { new: true });
  }

  async updateByRideId(ride_id, data) {
    return Payment.findOneAndUpdate({ ride_id }, data, { new: true });
  }
  // ===== Payment History (Mongo/Mongoose) =====
    async findPaymentsByDriver(driverId) {
      return Payment.find({ driver_id: driverId })
        .sort({ created_at: -1 })
        .lean();
    }
}

export default new PaymentRepository();
