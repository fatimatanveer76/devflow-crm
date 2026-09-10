import { DataTypes, Model } from 'sequelize';
import { uuidPrimaryKey, createModelOptions } from './baseModel.js';
import { ALL_TASK_STATUSES, ALL_TASK_PRIORITIES, TASK_STATUS, TASK_PRIORITY } from '../../config/tasks.js';

export class Task extends Model {}

export const initTask = (sequelize) => {
  Task.init(
    {
      id: uuidPrimaryKey,
      title: {
        type: DataTypes.STRING(300),
        allowNull: false,
        validate: {
          notEmpty: { msg: 'Task title cannot be empty' },
          len: { args: [2, 300], msg: 'Task title must be between 2 and 300 characters' },
        },
      },
      description: { type: DataTypes.TEXT, allowNull: true },
      status: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: TASK_STATUS.PENDING,
        validate: { isIn: { args: [ALL_TASK_STATUSES], msg: `Status must be one of: ${ALL_TASK_STATUSES.join(', ')}` } },
      },
      priority: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: TASK_PRIORITY.MEDIUM,
        validate: { isIn: { args: [ALL_TASK_PRIORITIES], msg: `Priority must be one of: ${ALL_TASK_PRIORITIES.join(', ')}` } },
      },
      due_date:      { type: DataTypes.DATE, allowNull: true },
      completed_at:  { type: DataTypes.DATE, allowNull: true },
      assigned_user_id: { type: DataTypes.UUID, allowNull: true },
      created_by_id:    { type: DataTypes.UUID, allowNull: true },
      lead_id:          { type: DataTypes.UUID, allowNull: true },
      deal_id:          { type: DataTypes.UUID, allowNull: true },
      project_id:       { type: DataTypes.UUID, allowNull: true },
    },
    {
      sequelize,
      ...createModelOptions({ tableName: 'tasks', paranoid: true, deletedAt: 'deleted_at' }),
      hooks: {
        beforeValidate: (task) => {
          if (task.title && typeof task.title === 'string') task.title = task.title.trim();
          if (task.description && typeof task.description === 'string') task.description = task.description.trim();
        },
        beforeSave: (task) => {
          if (task.status === TASK_STATUS.COMPLETED && !task.completed_at) {
            task.completed_at = new Date();
          }
          if (task.status !== TASK_STATUS.COMPLETED) {
            task.completed_at = null;
          }
        },
      },
    }
  );
  return Task;
};

export default Task;
