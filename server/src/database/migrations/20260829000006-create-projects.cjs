'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('projects', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING(200),
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      status: {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: 'planning',
      },
      priority: {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: 'medium',
      },
      start_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      due_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      budget: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0.00,
      },
      currency: {
        type: Sequelize.STRING(10),
        allowNull: false,
        defaultValue: 'USD',
      },
      deal_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'deals',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      lead_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'leads',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      assigned_user_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      created_by_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });

    await queryInterface.addIndex('projects', ['status'], {
      name: 'projects_status_idx',
    });
    await queryInterface.addIndex('projects', ['priority'], {
      name: 'projects_priority_idx',
    });
    await queryInterface.addIndex('projects', ['deal_id'], {
      name: 'projects_deal_id_idx',
    });
    await queryInterface.addIndex('projects', ['lead_id'], {
      name: 'projects_lead_id_idx',
    });
    await queryInterface.addIndex('projects', ['assigned_user_id'], {
      name: 'projects_assigned_user_id_idx',
    });
    await queryInterface.addIndex('projects', ['created_by_id'], {
      name: 'projects_created_by_id_idx',
    });
    await queryInterface.addIndex('projects', ['created_at'], {
      name: 'projects_created_at_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('projects');
  },
};
