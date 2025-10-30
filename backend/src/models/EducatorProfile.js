const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const EducatorProfile = sequelize.define('EducatorProfile', {
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
  organization: {
    type: DataTypes.STRING
  },
  website: {
    type: DataTypes.STRING,
    validate: {
      isUrl: true
    }
  },
  avatar_url: {
    type: DataTypes.STRING
  },
  social_links: {
    type: DataTypes.JSONB,
    defaultValue: {}
  }
}, {
  tableName: 'educator_profiles'
});

module.exports = EducatorProfile;
