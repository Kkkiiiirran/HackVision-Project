const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Problem = sequelize.define('Problem', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  module_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'modules',
      key: 'id'
    }
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  image_url: {
    type: DataTypes.STRING
  },
  difficulty: {
    type: DataTypes.ENUM('easy', 'medium', 'hard'),
    defaultValue: 'medium'
  },
  topics: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  sample_input: {
    type: DataTypes.TEXT
  },
  sample_output: {
    type: DataTypes.TEXT
  },
  created_by: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  deleted_at: {
    type: DataTypes.DATE
  }
}, {
  tableName: 'problems',
  paranoid: true,
  deletedAt: 'deleted_at',
  indexes: [
    { fields: ['module_id'] },
    { fields: ['difficulty'] },
    { fields: ['topics'], using: 'gin' }
  ]
});

module.exports = Problem;
