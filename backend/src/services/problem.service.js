const { Problem, Module } = require('../models');
const { Op } = require('sequelize');

class ProblemService {
  async createProblem(moduleId, creatorId, data) {
    const module = await Module.findByPk(moduleId);

    if (!module) {
      throw { statusCode: 404, message: 'Module not found' };
    }

    const problem = await Problem.create({
      ...data,
      module_id: moduleId,
      created_by: creatorId
    });

    return problem;
  }

  async getProblemsByModule(moduleId, filters = {}) {
    const { page = 1, limit = 20, difficulty } = filters;
    const offset = (page - 1) * limit;

    const where = { module_id: moduleId };

    if (difficulty) {
      where.difficulty = difficulty;
    }

    const { count, rows } = await Problem.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset,
      order: [['created_at', 'ASC']]
    });

    return {
      items: rows,
      total: count,
      page: parseInt(page),
      limit: parseInt(limit)
    };
  }

  async getProblemById(problemId) {
    const problem = await Problem.findByPk(problemId, {
      include: [
        {
          model: Module,
          as: 'module',
          attributes: ['id', 'title', 'educator_id']
        }
      ]
    });

    if (!problem) {
      throw { statusCode: 404, message: 'Problem not found' };
    }

    return problem;
  }

  async updateProblem(problemId, data) {
    const problem = await Problem.findByPk(problemId);

    if (!problem) {
      throw { statusCode: 404, message: 'Problem not found' };
    }

    await problem.update(data);
    return problem;
  }

  async deleteProblem(problemId) {
    const problem = await Problem.findByPk(problemId);

    if (!problem) {
      throw { statusCode: 404, message: 'Problem not found' };
    }

    await problem.destroy(); // Soft delete
  }
}

module.exports = new ProblemService();
