const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");

// GET all products
router.get("/", productController.getAllProducts);

router.get("/available", productController.getAvailableProducts);

// GET product by ID
router.get("/:id", productController.getProductById);

// POST create product
router.post("/", productController.createProduct);

// PATCH update product stock
router.patch("/:id/stock", productController.updateProductStock);

module.exports = router;
