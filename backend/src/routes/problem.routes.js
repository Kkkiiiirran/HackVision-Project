const express = require('express');
const router = express.Router();
const problemController = require('../controllers/problem.controller');
const authenticate = require('../middleware/authenticate');
const requireRole = require('../middleware/requireRole');
const { checkProblemOwnership } = require('../middleware/checkOwnership');
const validate = require('../middleware/validate');
const { updateProblemSchema } = require('../validators/problem.validator');

// Public route
router.get('/:problemId', problemController.getProblemById);

// Educator-only routes
router.put(
  '/:problemId',
  authenticate,
  requireRole('educator'),
  checkProblemOwnership,
  validate(updateProblemSchema),
  problemController.updateProblem
);

router.delete(
  '/:problemId',
  authenticate,
  requireRole('educator'),
  checkProblemOwnership,
  problemController.deleteProblem
);

module.exports = router;
