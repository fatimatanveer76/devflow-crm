'use strict';

/**
 * Migration: Update users table role default value to 'employee'
 * and add role_idx index for efficient RBAC queries.
 *
 * NOTE: The role column is STRING(50) and validation is enforced
 * at the application layer via Sequelize model. This migration:
 *   - Changes the column default from 'user' → 'employee'
 *   - Adds an index on the role column for performance
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Change the default value of role column to 'employee'
    await queryInterface.changeColumn('users', 'role', {
      type: Sequelize.STRING(50),
      allowNull: false,
      defaultValue: 'employee',
    });

    // Add index for role column (useful for RBAC queries)
    await queryInterface.addIndex('users', ['role'], {
      name: 'users_role_idx',
    });

    // Add index for is_active column (useful for active-user queries)
    await queryInterface.addIndex('users', ['is_active'], {
      name: 'users_is_active_idx',
    });
  },

  async down(queryInterface, Sequelize) {
    // Revert role default to 'user'
    await queryInterface.changeColumn('users', 'role', {
      type: Sequelize.STRING(50),
      allowNull: false,
      defaultValue: 'user',
    });

    // Remove added indexes
    await queryInterface.removeIndex('users', 'users_role_idx');
    await queryInterface.removeIndex('users', 'users_is_active_idx');
  },
};
