import { DataTypes, Model } from 'sequelize';
import { uuidPrimaryKey } from './baseModel.js';

/**
 * RequirementVersion — Immutable version snapshot.
 * Created whenever a requirement is updated. Records the full state at each version.
 * Records are append-only and must never be mutated after creation.
 */
export class RequirementVersion extends Model {}

export const initRequirementVersion = (sequelize) => {
  RequirementVersion.init(
    {
      id: uuidPrimaryKey,
      requirement_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      version_number: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      title: {
        type: DataTypes.STRING(300),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      type:     { type: DataTypes.STRING(50), allowNull: false },
      status:   { type: DataTypes.STRING(50), allowNull: false },
      priority: { type: DataTypes.STRING(20), allowNull: false },
      change_summary: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      tags: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: true,
        defaultValue: [],
      },
      created_by_id: { type: DataTypes.UUID, allowNull: true },
    },
    {
      sequelize,
      tableName: 'requirement_versions',
      timestamps: true,
      underscored: true,
      paranoid: false,
      updatedAt: false, // versions are append-only; no updated_at needed
    }
  );
  return RequirementVersion;
};

export default RequirementVersion;
