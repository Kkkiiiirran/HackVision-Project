const authService = require('../services/auth.service');

class AuthController {
  async educatorSignup(req, res, next) {
    try {
      const result = await authService.signupEducator(req.body);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  async studentSignup(req, res, next) {
    try {
      const result = await authService.signupStudent(req.body);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async refresh(req, res, next) {
    try {
      const { refresh_token } = req.body;
      const tokens = await authService.refresh(refresh_token);
      res.status(200).json(tokens);
    } catch (error) {
      next(error);
    }
  }

  async logout(req, res, next) {
    try {
      const { refresh_token } = req.body;
      await authService.logout(refresh_token);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
