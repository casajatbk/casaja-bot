const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
    required: true,
  },
  paymentMethod: {
    type: String,
    enum: ["qris", "cash", "transfer"],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  paymentStatus: {
    type: String,
    enum: [
      "waiting_payment",
      "waiting_approval",
      "approved",
      "on_rental",
      "returned",
      "cancelled",
      "rejected",
    ],
    default: "pending",
  },
  paymentProof: String,
  midtransTransactionId: String,
  notes: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Payment", paymentSchema);
