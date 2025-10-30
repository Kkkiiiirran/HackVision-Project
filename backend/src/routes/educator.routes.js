const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profile.controller');
const moduleController = require('../controllers/module.controller');
const enrollmentController = require('../controllers/enrollment.controller');
const authenticate = require('../middleware/authenticate');
const requireRole = require('../middleware/requireRole');

router.get('/me', authenticate, requireRole('educator'), profileController.getEducatorProfile);
router.put('/me', authenticate, requireRole('educator'), profileController.updateEducatorProfile);
router.get('/:educatorId/modules', moduleController.getModulesByEducator);

module.exports = router;
