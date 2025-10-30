const paymentService = require('../services/payment.service');

class PaymentController {
  async createOrder(req, res, next) {
    try {
      const result = await paymentService.createOrder(req.user.userId, req.params.moduleId);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  async verifyPayment(req, res, next) {
    try {
      const result = await paymentService.verifyPayment(req.body);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async handleWebhook(req, res, next) {
    try {
      const signature = req.headers['x-razorpay-signature'];
      const result = await paymentService.handleWebhook(signature, req.body);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new PaymentController();
