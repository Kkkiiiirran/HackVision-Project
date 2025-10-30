const { Module, Problem, User, Enrollment } = require('../models');
const { Op } = require('sequelize');

class ModuleService {
  async createModule(educatorId, data) {
    const module = await Module.create({
      ...data,
      educator_id: educatorId
    });

    return module;
  }

  async getModules(filters = {}) {
    const { page = 1, limit = 20, tag, topic, search, educator_id, sort = 'created_at' } = filters;

    const offset = (page - 1) * limit;

    const where = {};

    if (tag) {
      where.tags = { [Op.contains]: [tag] };
    }

    if (topic) {
      where.topics = { [Op.contains]: [topic] };
    }

    if (search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } }
      ];
    }

    if (educator_id) {
      where.educator_id = educator_id;
    }

    const { count, rows } = await Module.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset,
      order: [[sort, 'DESC']],
      include: [
        {
          model: User,
          as: 'educator',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    return {
      items: rows,
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(count / limit)
    };
  }

  async getModuleById(moduleId) {
    const module = await Module.findByPk(moduleId, {
      include: [
        {
          model: User,
          as: 'educator',
          attributes: ['id', 'name', 'email'],
          include: [
            {
              model: require('./EducatorProfile'),
              as: 'educatorProfile'
            }
          ]
        },
        {
          model: Problem,
          as: 'problems',
          attributes: ['id', 'title', 'difficulty']
        }
      ]
    });

    if (!module) {
      throw { statusCode: 404, message: 'Module not found' };
    }

    return module;
  }

  async updateModule(moduleId, data) {
    const module = await Module.findByPk(moduleId);

    if (!module) {
      throw { statusCode: 404, message: 'Module not found' };
    }

    await module.update(data);
    return module;
  }

  async deleteModule(moduleId) {
    const module = await Module.findByPk(moduleId);

    if (!module) {
      throw { statusCode: 404, message: 'Module not found' };
    }

    await module.destroy(); // Soft delete
  }

  async getModulesByEducator(educatorId) {
    return await Module.findAll({
      where: { educator_id: educatorId },
      order: [['created_at', 'DESC']]
    });
  }
}

module.exports = new ModuleService();
