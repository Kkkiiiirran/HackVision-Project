const express = require('express');
const router = express.Router();
const enrollmentController = require('../controllers/enrollment.controller');
const paymentController = require('../controllers/payment.controller');
const authenticate = require('../middleware/authenticate');
const requireRole = require('../middleware/requireRole');


router.post(
  '/modules/:moduleId/subscribe',
  authenticate,
  requireRole('student'),
  paymentController.createOrder
);


router.get(
  '/modules/:moduleId/students',
  authenticate,
  requireRole('educator'),
  enrollmentController.getModuleStudents
);


router.post(
  '/:enrollmentId/cancel',
  authenticate,
  enrollmentController.cancelEnrollment
);

module.exports = router;
