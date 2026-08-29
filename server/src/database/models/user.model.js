import { DataTypes, Model } from 'sequelize';
import bcrypt from 'bcryptjs';
import { uuidPrimaryKey, createModelOptions } from './baseModel.js';
import { ALL_ROLES, ROLES } from '../../config/roles.js';

export class User extends Model {
  /**
   * Compares provided plaintext password against the user's stored bcrypt password hash
   * @param {string} candidatePassword
   * @returns {Promise<boolean>}
   */
  async comparePassword(candidatePassword) {
    if (!this.password_hash) {
      return false;
    }
    return bcrypt.compare(candidatePassword, this.password_hash);
  }

  /**
   * Custom toJSON to guarantee password_hash is never serialized into API responses
   * @returns {Object} Safe user representation
   */
  toJSON() {
    const values = { ...this.get() };
    delete values.password_hash;
    return values;
  }
}

/**
 * Initializes the User model on the Sequelize instance
 * @param {import('sequelize').Sequelize} sequelize
 * @returns {typeof User}
 */
export const initUser = (sequelize) => {
  User.init(
    {
      id: uuidPrimaryKey,
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
          notEmpty: { msg: 'Name cannot be empty' },
          len: { args: [2, 100], msg: 'Name must be between 2 and 100 characters' },
        },
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: {
          name: 'users_email_unique',
          msg: 'Email address is already in use',
        },
        validate: {
          isEmail: { msg: 'Please provide a valid email address' },
          notEmpty: { msg: 'Email cannot be empty' },
        },
      },
      password_hash: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
          notEmpty: { msg: 'Password hash is required' },
        },
      },
      role: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: ROLES.EMPLOYEE,
        validate: {
          isIn: {
            args: [ALL_ROLES],
            msg: `Role must be one of: ${ALL_ROLES.join(', ')}`,
          },
        },
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      refresh_token_version: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
    },
    {
      sequelize,
      ...createModelOptions({
        tableName: 'users',
        paranoid: true,
        deletedAt: 'deleted_at',
      }),
      defaultScope: {
        attributes: {
          exclude: ['password_hash'],
        },
      },
      scopes: {
        withPassword: {
          attributes: {
            include: ['password_hash'],
          },
        },
      },
      hooks: {
        beforeValidate: (user) => {
          if (user.email && typeof user.email === 'string') {
            user.email = user.email.toLowerCase().trim();
          }
          if (user.name && typeof user.name === 'string') {
            user.name = user.name.trim();
          }
        },
        beforeSave: (user) => {
          if (user.email && typeof user.email === 'string') {
            user.email = user.email.toLowerCase().trim();
          }
        },
      },
    }
  );

  return User;
};
