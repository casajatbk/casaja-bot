const express = require('express');
const router = express.Router();
const orderItemController = require('../controllers/orderItemController');

// POST create order item
router.post('/', orderItemController.createOrderItem);

// GET order items by order ID
router.get('/:orderId', orderItemController.getOrderItems);

module.exports = router;
