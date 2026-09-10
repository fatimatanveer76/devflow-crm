import { DataTypes, Model } from 'sequelize';
import { uuidPrimaryKey, createModelOptions } from './baseModel.js';
import {
  ALL_PROJECT_STATUSES,
  ALL_PROJECT_PRIORITIES,
  PROJECT_STATUS,
  PROJECT_PRIORITY,
} from '../../config/projects.js';
import { ALL_DEAL_CURRENCIES, DEAL_CURRENCY } from '../../config/deals.js';

export class Project extends Model {}

/**
 * Initializes the Project model on the Sequelize instance
 * @param {import('sequelize').Sequelize} sequelize
 * @returns {typeof Project}
 */
export const initProject = (sequelize) => {
  Project.init(
    {
      id: uuidPrimaryKey,
      name: {
        type: DataTypes.STRING(200),
        allowNull: false,
        validate: {
          notEmpty: { msg: 'Project name cannot be empty' },
          len: { args: [2, 200], msg: 'Project name must be between 2 and 200 characters' },
        },
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      status: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: PROJECT_STATUS.PLANNING,
        validate: {
          isIn: {
            args: [ALL_PROJECT_STATUSES],
            msg: `Status must be one of: ${ALL_PROJECT_STATUSES.join(', ')}`,
          },
        },
      },
      priority: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: PROJECT_PRIORITY.MEDIUM,
        validate: {
          isIn: {
            args: [ALL_PROJECT_PRIORITIES],
            msg: `Priority must be one of: ${ALL_PROJECT_PRIORITIES.join(', ')}`,
          },
        },
      },
      start_date: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      due_date: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      budget: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0.00,
        validate: {
          min: { args: [0], msg: 'Project budget cannot be negative' },
        },
      },
      currency: {
        type: DataTypes.STRING(10),
        allowNull: false,
        defaultValue: DEAL_CURRENCY.USD,
        validate: {
          isIn: {
            args: [ALL_DEAL_CURRENCIES],
            msg: `Currency must be one of: ${ALL_DEAL_CURRENCIES.join(', ')}`,
          },
        },
      },
      deal_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      lead_id: {
        type: DataTypes.UUID,
        allowNull: true,
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
        tableName: 'projects',
        paranoid: true,
        deletedAt: 'deleted_at',
      }),
      hooks: {
        beforeValidate: (project) => {
          if (project.name && typeof project.name === 'string') {
            project.name = project.name.trim();
          }
          if (project.description && typeof project.description === 'string') {
            project.description = project.description.trim();
          }
          if (project.notes && typeof project.notes === 'string') {
            project.notes = project.notes.trim();
          }
        },
      },
    }
  );

  return Project;
};

export default Project;
