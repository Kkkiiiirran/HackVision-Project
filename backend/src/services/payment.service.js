const crypto = require('crypto');
const razorpayInstance = require('../config/razorpay');
const { Enrollment, PaymentRecord, Module } = require('../models');
const { sequelize } = require('../models');

class PaymentService {
  async createOrder(studentId, moduleId) {
    const module = await Module.findByPk(moduleId);

    if (!module) {
      throw { statusCode: 404, message: 'Module not found' };
    }

    // Check for existing enrollment
    const existingEnrollment = await Enrollment.findOne({
      where: { student_id: studentId, module_id: moduleId }
    });

    if (existingEnrollment && existingEnrollment.status === 'active') {
      throw { statusCode: 409, message: 'Already enrolled in this module' };
    }

    // Free module - instant enrollment
    if (module.price_cents === 0) {
      const enrollment = await Enrollment.create({
        student_id: studentId,
        module_id: moduleId,
        status: 'active',
        started_at: new Date(),
        amount_paid_cents: 0,
        currency: module.currency
      });

      return { enrollment, isFree: true };
    }

    // Paid module - create Razorpay order
    const transaction = await sequelize.transaction();

    try {
      const receipt = `order_${Date.now()}_${studentId.substring(0, 8)}`;

      const razorpayOrder = await razorpayInstance.orders.create({
        amount: module.price_cents,
        currency: module.currency,
        receipt,
        notes: {
          student_id: studentId,
          module_id: moduleId
        }
      });

      // Create pending enrollment
      const enrollment = await Enrollment.create({
        student_id: studentId,
        module_id: moduleId,
        status: 'pending',
        razorpay_order_id: razorpayOrder.id,
        amount_paid_cents: module.price_cents,
        currency: module.currency
      }, { transaction });

      // Create payment record
      await PaymentRecord.create({
        student_id: studentId,
        module_id: moduleId,
        razorpay_order_id: razorpayOrder.id,
        amount_cents: module.price_cents,
        status: 'created',
        raw_response_json: razorpayOrder
      }, { transaction });

      await transaction.commit();

      return {
        local_order_id: enrollment.id,
        razorpay_order: razorpayOrder,
        isFree: false
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async verifyPayment(paymentData) {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, module_id } = paymentData;

    // Verify signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      throw { statusCode: 400, message: 'Invalid payment signature' };
    }

    const transaction = await sequelize.transaction();

    try {
      // Update enrollment
      const enrollment = await Enrollment.findOne({
        where: { razorpay_order_id },
        transaction
      });

      if (!enrollment) {
        throw { statusCode: 404, message: 'Enrollment not found' };
      }

      await enrollment.update({
        status: 'active',
        razorpay_payment_id,
        started_at: new Date()
      }, { transaction });

      // Update payment record
      await PaymentRecord.update(
        {
          razorpay_payment_id,
          status: 'paid',
          raw_response_json: paymentData
        },
        {
          where: { razorpay_order_id },
          transaction
        }
      );

      await transaction.commit();

      return {
        enrollment_id: enrollment.id,
        status: 'active'
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async handleWebhook(signature, payload) {
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(JSON.stringify(payload))
      .digest('hex');

    if (expectedSignature !== signature) {
      throw { statusCode: 400, message: 'Invalid webhook signature' };
    }

    const event = payload.event;
    const paymentEntity = payload.payload.payment.entity;

    if (event === 'payment.captured') {
      await PaymentRecord.update(
        {
          status: 'paid',
          raw_response_json: paymentEntity
        },
        {
          where: { razorpay_payment_id: paymentEntity.id }
        }
      );
    }

    // Handle other webhook events (refunds, disputes, etc.)
    return { received: true };
  }
}

module.exports = new PaymentService();
