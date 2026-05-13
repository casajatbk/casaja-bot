const Payment = require("../models/Payment");
const Order = require("../models/Order");

// Create payment record
exports.createPayment = async (req, res) => {
  try {
    const { orderId, paymentMethod, amount, paymentStatus } = req.body;

    if (!orderId || !paymentMethod || !amount) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: orderId, paymentMethod, amount",
      });
    }

    const payment = new Payment({
      orderId,
      paymentMethod,
      amount,
      paymentStatus: paymentStatus || "pending",
    });

    await payment.save();
    console.log("[v0] Payment record created:", payment._id);

    res.status(201).json({
      success: true,
      message: "Payment record created",
      data: payment,
    });
  } catch (error) {
    console.error("[v0] Error creating payment:", error.message);
    res.status(500).json({
      success: false,
      message: "Error creating payment",
      error: error.message,
    });
  }
};

// Get payment by order ID
exports.getPaymentByOrderId = async (req, res) => {
  try {
    const payment = await Payment.findOne({ orderId: req.params.orderId });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    res.json({
      success: true,
      data: payment,
    });
  } catch (error) {
    console.error("Error fetching payment:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching payment",
      error: error.message,
    });
  }
};

// Update payment status
exports.updatePaymentStatus = async (req, res) => {
  try {
    const { paymentStatus } = req.body;

    if (
      ![
        "waiting_payment",
        "waiting_approval",
        "approved",
        "on_rental",
        "returned",
        "cancelled",
        "rejected",
      ].includes(paymentStatus)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid payment status. Must be: pending, completed, failed, or cancelled",
      });
    }

    const payment = await Payment.findByIdAndUpdate(
      req.params.id,
      { paymentStatus, updatedAt: new Date() },
      { new: true },
    );

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    // If payment is approved, update order status
    if (paymentStatus === "approved") {
      await Order.findByIdAndUpdate(payment.orderId, {
        orderStatus: "approved",
        paidAt: new Date(),
      });
      console.log("[v0] Order status updated to approved:", payment.orderId);
    }

    res.json({
      success: true,
      message: "Payment status updated",
      data: payment,
    });
  } catch (error) {
    console.error("[v0] Error updating payment:", error.message);
    res.status(500).json({
      success: false,
      message: "Error updating payment",
      error: error.message,
    });
  }
};
