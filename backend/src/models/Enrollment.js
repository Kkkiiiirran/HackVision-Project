const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Enrollment = sequelize.define('Enrollment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  student_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  module_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'modules',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM('active', 'cancelled', 'pending', 'failed'),
    defaultValue: 'pending'
  },
  started_at: {
    type: DataTypes.DATE
  },
  expires_at: {
    type: DataTypes.DATE
  },
  razorpay_order_id: {
    type: DataTypes.STRING
  },
  razorpay_payment_id: {
    type: DataTypes.STRING
  },
  amount_paid_cents: {
    type: DataTypes.INTEGER
  },
  currency: {
    type: DataTypes.STRING(3),
    defaultValue: 'INR'
  }
}, {
  tableName: 'enrollments',
  indexes: [
    { fields: ['student_id'] },
    { fields: ['module_id'] },
    { fields: ['status'] },
    { fields: ['student_id', 'module_id'], unique: true }
  ]
});

module.exports = Enrollment;
