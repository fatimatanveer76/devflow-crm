'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('activities', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      type: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
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
      project_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'projects',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      task_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'tasks',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      metadata: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('activities', ['type'], {
      name: 'activities_type_idx',
    });
    await queryInterface.addIndex('activities', ['user_id'], {
      name: 'activities_user_id_idx',
    });
    await queryInterface.addIndex('activities', ['lead_id'], {
      name: 'activities_lead_id_idx',
    });
    await queryInterface.addIndex('activities', ['deal_id'], {
      name: 'activities_deal_id_idx',
    });
    await queryInterface.addIndex('activities', ['project_id'], {
      name: 'activities_project_id_idx',
    });
    await queryInterface.addIndex('activities', ['task_id'], {
      name: 'activities_task_id_idx',
    });
    await queryInterface.addIndex('activities', ['created_at'], {
      name: 'activities_created_at_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('activities');
  },
};
