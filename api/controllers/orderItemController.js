const OrderItem = require("../models/OrderItem");
const Product = require("../models/Product");

// Create order item
exports.createOrderItem = async (req, res) => {
  try {
    const {
      orderId,
      productId,
      quantity,
      pricePerSession,
      subtotalPrice,
      rentalStart,
      rentalEnd,
    } = req.body;

    if (!orderId || !productId || !quantity) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    const orderItem = new OrderItem({
      orderId,
      productId,
      quantity,
      pricePerSession,
      subtotalPrice,
      rentalStart,
      rentalEnd,
    });

    await orderItem.save();

    res.status(201).json({
      success: true,
      message: "Order item created successfully",
      data: orderItem,
    });
  } catch (error) {
    console.error("Error creating order item:", error);
    res.status(500).json({
      success: false,
      message: "Error creating order item",
      error: error.message,
    });
  }
};

// Get order items by order ID
exports.getOrderItems = async (req, res) => {
  try {
    const items = await OrderItem.find({
      orderId: req.params.orderId,
    }).populate("productId");

    res.json({
      success: true,
      data: items,
      count: items.length,
    });
  } catch (error) {
    console.error("Error fetching order items:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching order items",
      error: error.message,
    });
  }
};
