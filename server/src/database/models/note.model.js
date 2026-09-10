import { DataTypes, Model } from 'sequelize';
import { uuidPrimaryKey, createModelOptions } from './baseModel.js';

export class Note extends Model {}

export const initNote = (sequelize) => {
  Note.init(
    {
      id: uuidPrimaryKey,
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: { notEmpty: { msg: 'Note content cannot be empty' } },
      },
      lead_id:    { type: DataTypes.UUID, allowNull: true },
      deal_id:    { type: DataTypes.UUID, allowNull: true },
      project_id: { type: DataTypes.UUID, allowNull: true },
      task_id:    { type: DataTypes.UUID, allowNull: true },
      created_by_id: { type: DataTypes.UUID, allowNull: true },
    },
    {
      sequelize,
      ...createModelOptions({ tableName: 'notes', paranoid: true, deletedAt: 'deleted_at' }),
      hooks: {
        beforeValidate: (note) => {
          if (note.content && typeof note.content === 'string') note.content = note.content.trim();
        },
      },
    }
  );
  return Note;
};

export default Note;
