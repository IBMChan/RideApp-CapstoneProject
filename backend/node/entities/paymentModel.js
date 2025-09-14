import {Schema,model}  from "mongoose";

const paymentSchema = new Schema({
  payment_id: {
    type: Number,      
    default: function(){
        const now= Date.now();
        return now;
    },
    unique:true,
    index: true
  },
  ride_id: {
    type: Number,     // store MySQL rider_id
    required: true
  },
  fare: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ["pending", "success", "failed"], 
    default: "pending"
  },
  mode: {
    type: String,
    enum: ["cash", "card", "upi", "wallet"],
    required: true
  },
  Payed_At: {
    type: Date,
    default: Date.now
  },
});

const Payment = model("Payments", paymentSchema);

export default Payment;