const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');

// Verify payment after checkout
router.post('/verify', paymentController.verifyPayment);

// Razorpay webhook
router.post('/webhooks/razorpay', paymentController.handleWebhook);

module.exports = router;
