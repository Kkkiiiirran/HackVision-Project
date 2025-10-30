const sequelize = require('../config/database');
const User = require('./User');
const EducatorProfile = require('./EducatorProfile');
const StudentProfile = require('./StudentProfile');
const Module = require('./Module');
const Problem = require('./Problem');
const Enrollment = require('./Enrollment');
const PaymentRecord = require('./PaymentRecord');

// Define associations
User.hasOne(EducatorProfile, { foreignKey: 'user_id', as: 'educatorProfile' });
EducatorProfile.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasOne(StudentProfile, { foreignKey: 'user_id', as: 'studentProfile' });
StudentProfile.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(Module, { foreignKey: 'educator_id', as: 'modules' });
Module.belongsTo(User, { foreignKey: 'educator_id', as: 'educator' });

Module.hasMany(Problem, { foreignKey: 'module_id', as: 'problems' });
Problem.belongsTo(Module, { foreignKey: 'module_id', as: 'module' });

User.hasMany(Enrollment, { foreignKey: 'student_id', as: 'enrollments' });
Enrollment.belongsTo(User, { foreignKey: 'student_id', as: 'student' });

Module.hasMany(Enrollment, { foreignKey: 'module_id', as: 'enrollments' });
Enrollment.belongsTo(Module, { foreignKey: 'module_id', as: 'module' });

User.hasMany(PaymentRecord, { foreignKey: 'student_id', as: 'payments' });
PaymentRecord.belongsTo(User, { foreignKey: 'student_id', as: 'student' });

Module.hasMany(PaymentRecord, { foreignKey: 'module_id', as: 'payments' });
PaymentRecord.belongsTo(Module, { foreignKey: 'module_id', as: 'module' });

module.exports = {
  sequelize,
  User,
  EducatorProfile,
  StudentProfile,
  Module,
  Problem,
  Enrollment,
  PaymentRecord
};
