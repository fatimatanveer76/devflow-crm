import { DataTypes, Model } from 'sequelize';
import { uuidPrimaryKey, createModelOptions } from './baseModel.js';
import {
  ALL_DEAL_STAGES,
  ALL_DEAL_STATUSES,
  ALL_DEAL_CURRENCIES,
  DEAL_STAGE,
  DEAL_STATUS,
  DEAL_CURRENCY,
  STAGE_PROBABILITY,
  getStatusForStage,
} from '../../config/deals.js';

export class Deal extends Model {}

/**
 * Initializes the Deal model on the Sequelize instance
 * @param {import('sequelize').Sequelize} sequelize
 * @returns {typeof Deal}
 */
export const initDeal = (sequelize) => {
  Deal.init(
    {
      id: uuidPrimaryKey,
      title: {
        type: DataTypes.STRING(200),
        allowNull: false,
        validate: {
          notEmpty: { msg: 'Deal title cannot be empty' },
          len: { args: [2, 200], msg: 'Title must be between 2 and 200 characters' },
        },
      },
      description: {
        type: DataTypes.TEXT,
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
      value: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0.00,
        validate: {
          min: { args: [0], msg: 'Deal value cannot be negative' },
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
      stage: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: DEAL_STAGE.QUALIFICATION,
        validate: {
          isIn: {
            args: [ALL_DEAL_STAGES],
            msg: `Stage must be one of: ${ALL_DEAL_STAGES.join(', ')}`,
          },
        },
      },
      probability: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 20,
        validate: {
          min: { args: [0], msg: 'Probability cannot be less than 0%' },
          max: { args: [100], msg: 'Probability cannot exceed 100%' },
        },
      },
      expected_close_date: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      status: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: DEAL_STATUS.OPEN,
        validate: {
          isIn: {
            args: [ALL_DEAL_STATUSES],
            msg: `Status must be one of: ${ALL_DEAL_STATUSES.join(', ')}`,
          },
        },
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      ...createModelOptions({
        tableName: 'deals',
        paranoid: true,
        deletedAt: 'deleted_at',
      }),
      hooks: {
        beforeValidate: (deal) => {
          if (deal.title && typeof deal.title === 'string') {
            deal.title = deal.title.trim();
          }
          if (deal.description && typeof deal.description === 'string') {
            deal.description = deal.description.trim();
          }
          // Align probability and status with stage if stage changed or created
          if (deal.stage && !deal.probability && deal.probability !== 0) {
            deal.probability = STAGE_PROBABILITY[deal.stage] ?? 20;
          }
          if (deal.stage && !deal.changed?.('status')) {
            deal.status = getStatusForStage(deal.stage);
          }
        },
      },
    }
  );

  return Deal;
};

export default Deal;
