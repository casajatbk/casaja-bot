const Order = require("../models/Order");
const OrderItem = require("../models/OrderItem");
const Payment = require("../models/Payment");
const Product = require("../models/Product");

// Get all orders
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      data: orders,
      count: orders.length,
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching orders",
      error: error.message,
    });
  }
};

// Get order by ID with items
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    const items = await OrderItem.find({ orderId: req.params.id }).populate(
      "productId",
    );
    const payment = await Payment.findOne({ orderId: req.params.id });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    res.json({
      success: true,
      data: {
        ...order.toObject(),
        items,
        payment,
      },
    });
  } catch (error) {
    console.error("Error fetching order:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching order",
      error: error.message,
    });
  }
};

// Create order
exports.createOrder = async (req, res) => {
  try {
    const {
      customerName,
      customerNim,
      customerEmail,
      customerPhone,
      deliveryRoom,
      paymentMethod,
      sessionCount,
      subtotalPrice,
    } = req.body;

    // Validate required fields
    if (
      !customerName ||
      !customerEmail ||
      !paymentMethod ||
      !sessionCount ||
      !subtotalPrice
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    const orderCode = `ORD-${Date.now()}`;

    const order = new Order({
      orderCode,
      customerName,
      customerNim,
      customerEmail,
      customerPhone,
      deliveryRoom,
      paymentMethod,
      sessionCount,
      subtotalPrice,
      orderStatus: "waiting_payment",
    });

    await order.save();
    console.log("[v0] Order created:", orderCode);

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: order,
    });
  } catch (error) {
    console.error("[v0] Error creating order:", error.message);
    res.status(500).json({
      success: false,
      message: "Error creating order",
      error: error.message,
    });
  }
};

// Update order status
exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderStatus } = req.body;

    if (
      !["waiting_payment", "confirmed", "completed", "cancelled"].includes(
        orderStatus,
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid order status",
      });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { orderStatus, updatedAt: new Date() },
      { new: true },
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    res.json({
      success: true,
      message: "Order status updated",
      data: order,
    });
  } catch (error) {
    console.error("Error updating order:", error);
    res.status(500).json({
      success: false,
      message: "Error updating order",
      error: error.message,
    });
  }
};

// Get orders by customer phone
exports.getOrdersByPhone = async (req, res) => {
  try {
    const { phone } = req.params;

    const orders = await Order.find({ customerPhone: phone }).sort({
      createdAt: -1,
    });

    res.json({
      success: true,
      data: orders,
      count: orders.length,
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching orders",
      error: error.message,
    });
  }
};
