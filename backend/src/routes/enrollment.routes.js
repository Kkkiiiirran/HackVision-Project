const express = require('express');
const router = express.Router();
const enrollmentController = require('../controllers/enrollment.controller');
const paymentController = require('../controllers/payment.controller');
const authenticate = require('../middleware/authenticate');
const requireRole = require('../middleware/requireRole');

// Subscribe to module (create order)
router.post(
  '/modules/:moduleId/subscribe',
  authenticate,
  requireRole('student'),
  paymentController.createOrder
);

// Get students in a module (educator only)
router.get(
  '/modules/:moduleId/students',
  authenticate,
  requireRole('educator'),
  enrollmentController.getModuleStudents
);

// Cancel enrollment
router.post(
  '/:enrollmentId/cancel',
  authenticate,
  enrollmentController.cancelEnrollment
);

module.exports = router;
