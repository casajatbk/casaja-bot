const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

// POST create payment
router.post('/', paymentController.createPayment);

// GET payment by order ID
router.get('/order/:orderId', paymentController.getPaymentByOrderId);

// PATCH update payment status
router.patch('/:id/status', paymentController.updatePaymentStatus);

module.exports = router;
