import { DataTypes, Model } from 'sequelize';
import { uuidPrimaryKey, createModelOptions } from './baseModel.js';

export class RefreshToken extends Model {
  /**
   * Checks if this refresh token record is currently valid (not revoked and not expired)
   * @returns {boolean}
   */
  isValid() {
    return !this.is_revoked && new Date() < new Date(this.expires_at);
  }
}

/**
 * Initializes the RefreshToken model on the Sequelize instance
 * @param {import('sequelize').Sequelize} sequelize
 * @returns {typeof RefreshToken}
 */
export const initRefreshToken = (sequelize) => {
  RefreshToken.init(
    {
      id: uuidPrimaryKey,
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      token_hash: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      family: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      is_revoked: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      expires_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    },
    {
      sequelize,
      ...createModelOptions({
        tableName: 'refresh_tokens',
        paranoid: true,
        deletedAt: 'deleted_at',
      }),
      indexes: [
        {
          name: 'refresh_tokens_user_id_idx',
          fields: ['user_id'],
        },
        {
          name: 'refresh_tokens_token_hash_idx',
          fields: ['token_hash'],
        },
      ],
    }
  );

  return RefreshToken;
};
