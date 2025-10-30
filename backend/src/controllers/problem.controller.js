const problemService = require('../services/problem.service');

class ProblemController {
  async createProblem(req, res, next) {
    try {
      const problem = await problemService.createProblem(
        req.params.moduleId,
        req.user.userId,
        req.body
      );
      res.status(201).json(problem);
    } catch (error) {
      next(error);
    }
  }

  async getProblemsByModule(req, res, next) {
    try {
      const result = await problemService.getProblemsByModule(req.params.moduleId, req.query);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getProblemById(req, res, next) {
    try {
      const problem = await problemService.getProblemById(req.params.problemId);
      res.status(200).json(problem);
    } catch (error) {
      next(error);
    }
  }

  async updateProblem(req, res, next) {
    try {
      const problem = await problemService.updateProblem(req.params.problemId, req.body);
      res.status(200).json(problem);
    } catch (error) {
      next(error);
    }
  }

  async deleteProblem(req, res, next) {
    try {
      await problemService.deleteProblem(req.params.problemId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ProblemController();
