const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const requireRole = require('../middleware/requireRole');
const { User, PaymentRecord, Enrollment, Module } = require('../models');

// Admin middleware
const adminOnly = [authenticate, requireRole('admin')];

// Get all users
router.get('/users', ...adminOnly, async (req, res, next) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password_hash'] },
      order: [['created_at', 'DESC']]
    });
    res.status(200).json(users);
  } catch (error) {
    next(error);
  }
});

// Get all payments
router.get('/payments', ...adminOnly, async (req, res, next) => {
  try {
    const payments = await PaymentRecord.findAll({
      order: [['created_at', 'DESC']],
      limit: 100
    });
    res.status(200).json(payments);
  } catch (error) {
    next(error);
  }
});

// Force enroll a student
router.post('/modules/:moduleId/force-enroll', ...adminOnly, async (req, res, next) => {
  try {
    const { student_id } = req.body;

    const enrollment = await Enrollment.create({
      student_id,
      module_id: req.params.moduleId,
      status: 'active',
      started_at: new Date(),
      amount_paid_cents: 0
    });

    res.status(201).json(enrollment);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
