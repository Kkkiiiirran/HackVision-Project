const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profile.controller');
const enrollmentController = require('../controllers/enrollment.controller');
const authenticate = require('../middleware/authenticate');
const requireRole = require('../middleware/requireRole');

router.get('/me', authenticate, requireRole('student'), profileController.getStudentProfile);
router.put('/me', authenticate, requireRole('student'), profileController.updateStudentProfile);
router.get('/me/enrollments', authenticate, requireRole('student'), enrollmentController.getStudentEnrollments);

module.exports = router;
