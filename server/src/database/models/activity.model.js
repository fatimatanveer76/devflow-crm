import { DataTypes, Model } from 'sequelize';
import { uuidPrimaryKey, createModelOptions } from './baseModel.js';

export const ACTIVITY_TYPES = Object.freeze([
  'lead_created', 'lead_updated', 'lead_status_changed', 'lead_assigned',
  'deal_created', 'deal_updated', 'deal_stage_changed', 'deal_status_changed', 'deal_assigned',
  'project_created', 'project_updated', 'project_status_changed', 'project_assigned',
  'task_created', 'task_updated', 'task_status_changed', 'task_completed', 'task_assigned',
  'note_added', 'note_updated',
  'requirement_created', 'requirement_updated', 'requirement_version_created',
  'requirement_status_changed', 'requirement_approved', 'requirement_rejected', 'requirement_published',
]);

export class Activity extends Model {}

export const initActivity = (sequelize) => {
  Activity.init(
    {
      id: uuidPrimaryKey,
      type: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: { isIn: { args: [ACTIVITY_TYPES], msg: `Activity type must be one of the allowed types` } },
      },
      description: { type: DataTypes.TEXT,         allowNull: false },
      user_id:     { type: DataTypes.UUID,         allowNull: true },
      lead_id:     { type: DataTypes.UUID,         allowNull: true },
      deal_id:     { type: DataTypes.UUID,         allowNull: true },
      project_id:  { type: DataTypes.UUID,         allowNull: true },
      task_id:     { type: DataTypes.UUID,         allowNull: true },
      metadata:    { type: DataTypes.JSONB,        allowNull: true },
    },
    {
      sequelize,
      ...createModelOptions({ tableName: 'activities', paranoid: false }),
      updatedAt: false,
    }
  );
  return Activity;
};

export default Activity;
