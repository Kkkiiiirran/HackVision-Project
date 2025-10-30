const moduleService = require('../services/module.service');

class ModuleController {
  async createModule(req, res, next) {
    try {
      const module = await moduleService.createModule(req.user.userId, req.body);
      res.status(201).json(module);
    } catch (error) {
      next(error);
    }
  }

  async getModules(req, res, next) {
    try {
      const result = await moduleService.getModules(req.query);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getModuleById(req, res, next) {
    try {
      const module = await moduleService.getModuleById(req.params.moduleId);
      res.status(200).json(module);
    } catch (error) {
      next(error);
    }
  }

  async updateModule(req, res, next) {
    try {
      const module = await moduleService.updateModule(req.params.moduleId, req.body);
      res.status(200).json(module);
    } catch (error) {
      next(error);
    }
  }

  async deleteModule(req, res, next) {
    try {
      await moduleService.deleteModule(req.params.moduleId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  async getModulesByEducator(req, res, next) {
    try {
      const modules = await moduleService.getModulesByEducator(req.params.educatorId);
      res.status(200).json(modules);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ModuleController();
