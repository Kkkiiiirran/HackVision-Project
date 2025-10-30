const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const StudentProfile = sequelize.define('StudentProfile', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    unique: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  bio: {
    type: DataTypes.TEXT
  },
  avatar_url: {
    type: DataTypes.STRING
  },
  education: {
    type: DataTypes.STRING
  }
}, {
  tableName: 'student_profiles'
});

module.exports = StudentProfile;
