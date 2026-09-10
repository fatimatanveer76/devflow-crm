import { DataTypes, Model } from 'sequelize';
import { uuidPrimaryKey, createModelOptions } from './baseModel.js';
import {
  ALL_LEAD_STATUSES,
  ALL_LEAD_PRIORITIES,
  ALL_LEAD_SOURCES,
  LEAD_STATUS,
  LEAD_PRIORITY,
  LEAD_SOURCE,
} from '../../config/leads.js';

export class Lead extends Model {}

/**
 * Initializes the Lead model on the Sequelize instance
 * @param {import('sequelize').Sequelize} sequelize
 * @returns {typeof Lead}
 */
export const initLead = (sequelize) => {
  Lead.init(
    {
      id: uuidPrimaryKey,
      name: {
        type: DataTypes.STRING(150),
        allowNull: false,
        validate: {
          notEmpty: { msg: 'Lead contact name cannot be empty' },
          len: { args: [2, 150], msg: 'Name must be between 2 and 150 characters' },
        },
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: true,
        validate: {
          isEmail: {
            msg: 'Please provide a valid email address',
          },
        },
      },
      phone: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      company: {
        type: DataTypes.STRING(150),
        allowNull: true,
      },
      source: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: LEAD_SOURCE.WEBSITE,
        validate: {
          isIn: {
            args: [ALL_LEAD_SOURCES],
            msg: `Source must be one of: ${ALL_LEAD_SOURCES.join(', ')}`,
          },
        },
      },
      status: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: LEAD_STATUS.NEW,
        validate: {
          isIn: {
            args: [ALL_LEAD_STATUSES],
            msg: `Status must be one of: ${ALL_LEAD_STATUSES.join(', ')}`,
          },
        },
      },
      priority: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: LEAD_PRIORITY.MEDIUM,
        validate: {
          isIn: {
            args: [ALL_LEAD_PRIORITIES],
            msg: `Priority must be one of: ${ALL_LEAD_PRIORITIES.join(', ')}`,
          },
        },
      },
      assigned_user_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      created_by_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      ...createModelOptions({
        tableName: 'leads',
        paranoid: true,
        deletedAt: 'deleted_at',
      }),
      hooks: {
        beforeValidate: (lead) => {
          if (lead.email && typeof lead.email === 'string') {
            const trimmed = lead.email.toLowerCase().trim();
            lead.email = trimmed.length > 0 ? trimmed : null;
          }
          if (lead.name && typeof lead.name === 'string') {
            lead.name = lead.name.trim();
          }
          if (lead.company && typeof lead.company === 'string') {
            lead.company = lead.company.trim();
          }
          if (lead.phone && typeof lead.phone === 'string') {
            lead.phone = lead.phone.trim();
          }
        },
      },
    }
  );

  return Lead;
};

export default Lead;
