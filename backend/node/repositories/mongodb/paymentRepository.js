//shriya -payment history --FETCH
//chandana - payment details -- post (add)
//chandana - wallet management

// backend/repositories/mongodb/paymentRepository.js
import Payment from "../../entities/paymentModel.js";

class PaymentRepository {
  async create(paymentObj) {
    const p = new Payment(paymentObj);
    return await p.save();
  }

  async findByRideId(ride_id) {
    return await Payment.findOne({ ride_id });
  }

  async findById(payment_id) {
    return await Payment.findOne({ payment_id });
  }

  async updateStatus(payment_id, updateObj) {
    return await Payment.findOneAndUpdate(
      { payment_id },
      { $set: updateObj },
      { new: true }
    );
  }

  async ensureForRide(ride_id, fare = 0, mode = "cash") {
    let existing = await this.findByRideId(ride_id);
    if (existing) return existing;
    return await this.create({
      ride_id,
      fare,
      mode,
      status: "pending",
    });
  }
}

export default new PaymentRepository();
