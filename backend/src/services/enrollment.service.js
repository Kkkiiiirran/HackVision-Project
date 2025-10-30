const { Enrollment, Module, User, StudentProfile } = require('../models');

class EnrollmentService {
  async getStudentEnrollments(studentId) {
    const enrollments = await Enrollment.findAll({
      where: { student_id: studentId },
      include: [
        {
          model: Module,
          as: 'module',
          attributes: ['id', 'title', 'description', 'cover_image_url']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    return enrollments;
  }

  async getModuleStudents(moduleId, educatorId) {
    const module = await Module.findByPk(moduleId);

    if (!module) {
      throw { statusCode: 404, message: 'Module not found' };
    }

    if (module.educator_id !== educatorId) {
      throw { statusCode: 403, message: 'You do not own this module' };
    }

    const enrollments = await Enrollment.findAll({
      where: { module_id: moduleId, status: 'active' },
      include: [
        {
          model: User,
          as: 'student',
          attributes: ['id', 'name', 'email'],
          include: [
            {
              model: StudentProfile,
              as: 'studentProfile'
            }
          ]
        }
      ],
      order: [['started_at', 'DESC']]
    });

    return enrollments;
  }

  async cancelEnrollment(enrollmentId, userId, userRole) {
    const enrollment = await Enrollment.findByPk(enrollmentId);

    if (!enrollment) {
      throw { statusCode: 404, message: 'Enrollment not found' };
    }

    // Students can cancel their own enrollments
    // Educators can cancel enrollments in their modules
    if (userRole === 'student' && enrollment.student_id !== userId) {
      throw { statusCode: 403, message: 'Not authorized' };
    }

    if (userRole === 'educator') {
      const module = await Module.findByPk(enrollment.module_id);
      if (module.educator_id !== userId) {
        throw { statusCode: 403, message: 'Not authorized' };
      }
    }

    await enrollment.update({ status: 'cancelled' });
    return enrollment;
  }

  async checkEnrollment(studentId, moduleId) {
    const enrollment = await Enrollment.findOne({
      where: {
        student_id: studentId,
        module_id: moduleId,
        status: 'active'
      }
    });

    return !!enrollment;
  }
}

module.exports = new EnrollmentService();
