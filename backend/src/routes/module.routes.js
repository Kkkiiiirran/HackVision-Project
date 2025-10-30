const express = require('express');
const router = express.Router();
const moduleController = require('../controllers/module.controller');
const problemController = require('../controllers/problem.controller');
const authenticate = require('../middleware/authenticate');
const requireRole = require('../middleware/requireRole');
const { checkModuleOwnership } = require('../middleware/checkOwnership');
const validate = require('../middleware/validate');
const { createModuleSchema, updateModuleSchema } = require('../validators/module.validator');
const { createProblemSchema } = require('../validators/problem.validator');

// Public routes
router.get('/', moduleController.getModules);
router.get('/:moduleId', moduleController.getModuleById);
router.get('/:moduleId/problems', problemController.getProblemsByModule);

// Educator-only routes
router.post(
  '/',
  authenticate,
  requireRole('educator'),
  validate(createModuleSchema),
  moduleController.createModule
);

router.put(
  '/:moduleId',
  authenticate,
  requireRole('educator'),
  checkModuleOwnership,
  validate(updateModuleSchema),
  moduleController.updateModule
);

router.delete(
  '/:moduleId',
  authenticate,
  requireRole('educator'),
  checkModuleOwnership,
  moduleController.deleteModule
);

router.post(
  '/:moduleId/problems',
  authenticate,
  requireRole('educator'),
  checkModuleOwnership,
  validate(createProblemSchema),
  problemController.createProblem
);

module.exports = router;
