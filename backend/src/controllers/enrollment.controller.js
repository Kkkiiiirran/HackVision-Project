const enrollmentService = require('../services/enrollment.service');

class EnrollmentController {
  async getStudentEnrollments(req, res, next) {
    try {
      const enrollments = await enrollmentService.getStudentEnrollments(req.user.userId);
      res.status(200).json(enrollments);
    } catch (error) {
      next(error);
    }
  }

  async getModuleStudents(req, res, next) {
    try {
      const students = await enrollmentService.getModuleStudents(
        req.params.moduleId,
        req.user.userId
      );
      res.status(200).json(students);
    } catch (error) {
      next(error);
    }
  }

  async cancelEnrollment(req, res, next) {
    try {
      const enrollment = await enrollmentService.cancelEnrollment(
        req.params.enrollmentId,
        req.user.userId,
        req.user.role
      );
      res.status(200).json(enrollment);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new EnrollmentController();
