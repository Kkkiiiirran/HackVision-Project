const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PaymentRecord = sequelize.define('PaymentRecord', {
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
  razorpay_order_id: {
    type: DataTypes.STRING,
    allowNull: false
  },
  razorpay_payment_id: {
    type: DataTypes.STRING
  },
  amount_cents: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('created', 'attempted', 'paid', 'failed', 'refunded'),
    defaultValue: 'created'
  },
  raw_response_json: {
    type: DataTypes.JSONB
  }
}, {
  tableName: 'payment_records',
  indexes: [
    { fields: ['student_id'] },
    { fields: ['razorpay_order_id'] },
    { fields: ['razorpay_payment_id'] }
  ]
});

module.exports = PaymentRecord;
