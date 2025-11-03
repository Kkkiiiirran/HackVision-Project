const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');

router.post('/verify', paymentController.verifyPayment);


router.post('/webhooks/razorpay', paymentController.handleWebhook);

module.exports = router;
