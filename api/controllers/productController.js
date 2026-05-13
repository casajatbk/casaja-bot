const Product = require("../models/Product");
const OrderItem = require("../models/OrderItem");
const Order = require("../models/Order");

// Get all products
exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.find({ status: "active" })
      .select("name holes pricePerSession availableStock description")
      .sort({ createdAt: -1 });

    console.log("[v0] Fetched", products.length, "products");

    res.json({
      success: true,
      data: products,
      count: products.length,
    });
  } catch (error) {
    console.error("[v0] Error fetching products:", error.message);
    res.status(500).json({
      success: false,
      message: "Error fetching products",
      error: error.message,
    });
  }
};

// ============================================================
// GET /api/products/available?rentalStart=...&rentalEnd=...
// Mengembalikan produk yang stoknya masih tersedia pada
// rentang waktu yang diminta (tidak bentrok dengan order aktif)
// ============================================================
exports.getAvailableProducts = async (req, res) => {
  try {
    const { rentalStart, rentalEnd } = req.query;

    if (!rentalStart || !rentalEnd) {
      return res.status(400).json({
        success: false,
        message: "rentalStart dan rentalEnd wajib diisi",
      });
    }

    const start = new Date(rentalStart);
    const end = new Date(rentalEnd);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Format tanggal tidak valid",
      });
    }

    // 1. Cari semua order yang sedang aktif (bukan cancelled/returned/rejected)
    const activeOrders = await Order.find({
      orderStatus: { $nin: ["cancelled", "returned", "rejected"] },
    }).select("_id");

    const activeOrderIds = activeOrders.map((o) => o._id);

    // 2. Cari order_items yang bentrok dengan rentang waktu yang diminta
    //    Kondisi overlap: rentalStart < req.end AND rentalEnd > req.start
    const conflictingItems = await OrderItem.find({
      orderId: { $in: activeOrderIds },
      rentalStart: { $lt: end },
      rentalEnd: { $gt: start },
    }).select("productId quantity");

    // 3. Hitung total quantity yang sedang terpakai per produk
    const usedStockMap = {};
    for (const item of conflictingItems) {
      const pid = item.productId.toString();
      usedStockMap[pid] = (usedStockMap[pid] || 0) + (item.quantity || 1);
    }

    // 4. Ambil semua produk aktif
    const allProducts = await Product.find({ status: "active" })
      .select("name holes pricePerSession availableStock description")
      .sort({ holes: 1 });

    // 5. Filter produk yang masih punya stok tersedia
    const availableProducts = allProducts
      .map((p) => {
        const pid = p._id.toString();
        const usedStock = usedStockMap[pid] || 0;
        const remainingStock = p.availableStock - usedStock;
        return {
          ...p.toObject(),
          remainingStock,
        };
      })
      .filter((p) => p.remainingStock > 0);

    console.log(
      `[v0] Available products for ${rentalStart} - ${rentalEnd}:`,
      availableProducts.length,
    );

    res.json({
      success: true,
      data: availableProducts,
      count: availableProducts.length,
    });
  } catch (error) {
    console.error("[v0] Error fetching available products:", error.message);
    res.status(500).json({
      success: false,
      message: "Error fetching available products",
      error: error.message,
    });
  }
};

// Get product by ID
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching product",
      error: error.message,
    });
  }
};

// Create product (admin only)
exports.createProduct = async (req, res) => {
  try {
    const { name, holes, pricePerSession, availableStock, description } =
      req.body;

    if (!name || !holes || !pricePerSession) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: name, holes, pricePerSession",
      });
    }

    const product = new Product({
      name,
      holes,
      pricePerSession,
      availableStock: availableStock || 0,
      description,
    });

    await product.save();

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: product,
    });
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(500).json({
      success: false,
      message: "Error creating product",
      error: error.message,
    });
  }
};

// Update product stock
exports.updateProductStock = async (req, res) => {
  try {
    const { availableStock } = req.body;
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { availableStock },
      { new: true },
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.json({
      success: true,
      message: "Product stock updated",
      data: product,
    });
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({
      success: false,
      message: "Error updating product",
      error: error.message,
    });
  }
};
