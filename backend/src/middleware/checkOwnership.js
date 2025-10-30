const { Module, Problem } = require('../models');

const checkModuleOwnership = async (req, res, next) => {
  try {
    const moduleId = req.params.moduleId || req.params.id;

    const module = await Module.findByPk(moduleId);

    if (!module) {
      return res.status(404).json({ error: 'Module not found' });
    }

    if (module.educator_id !== req.user.userId) {
      return res.status(403).json({ error: 'You do not own this module' });
    }

    req.module = module;
    next();
  } catch (error) {
    return res.status(500).json({ error: 'Error checking ownership' });
  }
};

const checkProblemOwnership = async (req, res, next) => {
  try {
    const problemId = req.params.problemId || req.params.id;

    const problem = await Problem.findByPk(problemId, {
      include: [{ model: Module, as: 'module' }]
    });

    if (!problem) {
      return res.status(404).json({ error: 'Problem not found' });
    }

    if (problem.module.educator_id !== req.user.userId) {
      return res.status(403).json({ error: 'You do not own this problem' });
    }

    req.problem = problem;
    next();
  } catch (error) {
    return res.status(500).json({ error: 'Error checking ownership' });
  }
};

module.exports = { checkModuleOwnership, checkProblemOwnership };
