const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  orderCode: {
    type: String,
    required: true,
    unique: true,
  },
  customerName: {
    type: String,
    required: true,
  },
  customerNim: {
    type: String,
    required: true,
  },
  customerEmail: {
    type: String,
    required: true,
  },
  customerPhone: {
    type: String,
    required: true,
  },
  deliveryRoom: {
    type: String,
    required: true,
  },
  paymentMethod: {
    type: String,
    enum: ["qris", "cash", "transfer"],
    required: true,
  },
  sessionCount: {
    type: Number,
    required: true,
    default: 1,
  },
  subtotalPrice: {
    type: Number,
    required: true,
  },

  orderStatus: {
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
    default: "waiting_payment",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Order", orderSchema);
