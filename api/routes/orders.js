const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

// GET all orders
router.get('/', orderController.getAllOrders);

// GET orders by phone
router.get('/phone/:phone', orderController.getOrdersByPhone);

// GET order by ID
router.get('/:id', orderController.getOrderById);

// POST create order
router.post('/', orderController.createOrder);

// PATCH update order status
router.patch('/:id/status', orderController.updateOrderStatus);

module.exports = router;
