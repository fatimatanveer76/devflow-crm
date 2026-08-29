import { DataTypes } from 'sequelize';

/**
 * Base Model Conventions for DevFlow CRM
 *
 * All future entity models (Users, Organizations, Leads, Deals, Projects, Tasks, etc.)
 * MUST adhere to the following architectural conventions:
 *
 * 1. Primary Keys:
 *    - Use UUIDv4 for distributed uniqueness and security (prevents ID enumeration attacks).
 *
 * 2. Timestamps:
 *    - Always enable timestamps (`timestamps: true`).
 *    - Use snake_case column names in database (`underscored: true`):
 *      - createdAt -> created_at
 *      - updatedAt -> updated_at
 *      - deletedAt -> deleted_at / archived_at
 *
 * 3. Soft Deletes (Paranoid):
 *    - Critical business entities (Users, Leads, Deals, Projects, Invoices) should use soft deletes:
 *      `paranoid: true`, `deletedAt: 'deleted_at'` or `deletedAt: 'archived_at'`.
 *
 * 4. Explicit Table Names:
 *    - Always specify explicit `tableName` in plural snake_case (e.g., `tableName: 'users'`).
 *
 * 5. Foreign Keys:
 *    - Explicit naming: `[entity]_id` (e.g., `user_id`, `client_id`, `project_id`).
 *    - Appropriate ON DELETE constraints (`CASCADE`, `SET NULL`, or `RESTRICT`).
 */

/**
 * Standard UUID Primary Key column definition
 */
export const uuidPrimaryKey = {
  type: DataTypes.UUID,
  defaultValue: DataTypes.UUIDV4,
  primaryKey: true,
  allowNull: false,
};

/**
 * Standard model options builder with enterprise conventions
 * @param {Object} options Custom model options
 * @param {string} options.tableName Explicit table name in database (e.g. 'users')
 * @param {boolean} [options.paranoid=true] Whether to enable soft-deletes
 * @param {string} [options.deletedAt='deleted_at'] Column name for soft delete timestamp
 * @returns {Object} Sequelize model options
 */
export const createModelOptions = ({
  tableName,
  paranoid = true,
  deletedAt = 'deleted_at',
  ...rest
}) => ({
  tableName,
  timestamps: true,
  underscored: true,
  paranoid,
  deletedAt: paranoid ? deletedAt : undefined,
  ...rest,
});
