import { DataTypes, Model } from 'sequelize';
import { uuidPrimaryKey, createModelOptions } from './baseModel.js';
import {
  ALL_REQUIREMENT_STATUSES,
  ALL_REQUIREMENT_PRIORITIES,
  ALL_REQUIREMENT_TYPES,
} from '../../config/requirements.js';

export class Requirement extends Model {}

export const initRequirement = (sequelize) => {
  Requirement.init(
    {
      id: uuidPrimaryKey,
      title: {
        type: DataTypes.STRING(300),
        allowNull: false,
        validate: {
          notEmpty: { msg: 'Requirement title cannot be empty.' },
          len: { args: [1, 300], msg: 'Title must be between 1 and 300 characters.' },
        },
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      type: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: 'functional',
        validate: {
          isIn: { args: [ALL_REQUIREMENT_TYPES], msg: 'Invalid requirement type.' },
        },
      },
      status: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: 'draft',
        validate: {
          isIn: { args: [ALL_REQUIREMENT_STATUSES], msg: 'Invalid requirement status.' },
        },
      },
      priority: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'medium',
        validate: {
          isIn: { args: [ALL_REQUIREMENT_PRIORITIES], msg: 'Invalid requirement priority.' },
        },
      },
      version_number: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
        validate: {
          min: { args: [1], msg: 'Version number must be at least 1.' },
        },
      },
      project_id:    { type: DataTypes.UUID, allowNull: true },
      deal_id:       { type: DataTypes.UUID, allowNull: true },
      created_by_id: { type: DataTypes.UUID, allowNull: true },
      approved_by_id: { type: DataTypes.UUID, allowNull: true },
      approved_at:   { type: DataTypes.DATE, allowNull: true },
      rejection_reason: { type: DataTypes.TEXT, allowNull: true },
      tags: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: true,
        defaultValue: [],
      },
    },
    {
      sequelize,
      ...createModelOptions({ tableName: 'requirements', paranoid: true }),
      hooks: {
        beforeValidate: (req) => {
          if (req.title && typeof req.title === 'string') req.title = req.title.trim();
          if (req.description && typeof req.description === 'string') req.description = req.description.trim();
        },
      },
    }
  );
  return Requirement;
};

export default Requirement;
