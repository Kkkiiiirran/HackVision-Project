const express = require('express');
const router = express.Router();
console.log('[debug] module.routes loaded');
const moduleController = require('../controllers/module.controller');
const problemController = require('../controllers/problem.controller');
const authenticate = require('../middleware/authenticate');
const requireRole = require('../middleware/requireRole');
const { checkModuleOwnership } = require('../middleware/checkOwnership');
const validate = require('../middleware/validate');
const { createModuleSchema, updateModuleSchema } = require('../validators/module.validator');
const { createProblemSchema } = require('../validators/problem.validator');


router.get('/', moduleController.getModules);
router.get('/:moduleId', moduleController.getModuleById);
router.get('/:moduleId/problems', problemController.getProblemsByModule);


router.post(
  '/',
  authenticate,
  requireRole('educator'),
  validate(createModuleSchema),
  moduleController.createModule
);

// Generate a module using AI agents and create it (educator only)
router.post(
  '/generate',
  authenticate,
  requireRole('educator'),
  (req, res, next) => moduleController.generateModule(req, res, next)
);

// Dev-only: unauthenticated generate helper for quick frontend testing
// Expose debug endpoint when not running in production
if (process.env.NODE_ENV !== 'production') {
  router.post('/generate-debug', (req, res) => {
    // Return a small sample module + problems so frontend integration can be tested without running agents
    const sample = {
      module: {
        id: 'dev-module-1',
        educator_id: 'dev-educator',
        title: 'Dev Sample Module',
        description: 'This is a dev-only sample module generated for testing.'
      },
      problems: [
        {
          id: 'dev-prob-1',
          title: 'Two Sum (dev)',
          description: 'Given an array, find two numbers that add up to target.',
          difficulty: 'easy',
          topics: ['arrays', 'hashing']
        },
        {
          id: 'dev-prob-2',
          title: 'Sliding Window (dev)',
          description: 'Find the maximum sum subarray of size k.',
          difficulty: 'medium',
          topics: ['sliding-window']
        }
      ]
    };
    return res.status(201).json(sample);
  });
}

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
