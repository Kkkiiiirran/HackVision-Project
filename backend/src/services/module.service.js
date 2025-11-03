const moduleService = require('../services/module.service');
const problemService = require('../services/problem.service');

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

  // -------------------- GENERATE MODULE --------------------
  async generateModule(req, res, next) {
    try {
      const educatorId = req.user.userId;
      const { description } = req.body || {};

      // Call FastAPI to generate module + problems
      const resp = await fetch("http://127.0.0.1:8000/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description }),
      });

      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(`Agents FastAPI error: ${text}`);
      }

      const { module: quizModule } = await resp.json();

      // Ensure problems is always an array
      const problemsArray = Array.isArray(quizModule.problems)
        ? quizModule.problems
        : quizModule.problems
          ? [quizModule.problems]
          : [];

      // Create module in Node.js DB
      const createdModule = await moduleService.createModule(educatorId, {
        title: quizModule.title || "AI Generated Module",
        description: quizModule.description || "",
        price_cents: 0,
        currency: "INR",
        tags: quizModule.tags || [],
        topics: quizModule.topics || [],
      });

      // Create problems
      const createdProblems = [];
      for (const p of problemsArray) {
        const problem = await problemService.createProblem(createdModule.id, educatorId, {
          title: p.problem_title || p.title || "AI Problem",
          description: p.problem_description || p.description || null,
          difficulty: p.difficulty || "medium",
          image_url: p.image_url || null,
          sample_input: p.sample_input || null,
          sample_output: p.sample_output || null,
          topics: p.topics || [],
        });
        createdProblems.push(problem);
      }

      res.status(201).json({ module: createdModule, problems: createdProblems });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ModuleController();
