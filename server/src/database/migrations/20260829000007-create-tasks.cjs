'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('tasks', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      title: {
        type: Sequelize.STRING(300),
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      status: {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: 'pending',
      },
      priority: {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: 'medium',
      },
      due_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      completed_at: {
        type: Sequelize.DATE,
        allowNull: true,
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

    await queryInterface.addIndex('tasks', ['status'], {
      name: 'tasks_status_idx',
    });
    await queryInterface.addIndex('tasks', ['priority'], {
      name: 'tasks_priority_idx',
    });
    await queryInterface.addIndex('tasks', ['assigned_user_id'], {
      name: 'tasks_assigned_user_id_idx',
    });
    await queryInterface.addIndex('tasks', ['created_by_id'], {
      name: 'tasks_created_by_id_idx',
    });
    await queryInterface.addIndex('tasks', ['lead_id'], {
      name: 'tasks_lead_id_idx',
    });
    await queryInterface.addIndex('tasks', ['deal_id'], {
      name: 'tasks_deal_id_idx',
    });
    await queryInterface.addIndex('tasks', ['project_id'], {
      name: 'tasks_project_id_idx',
    });
    await queryInterface.addIndex('tasks', ['due_date'], {
      name: 'tasks_due_date_idx',
    });
    await queryInterface.addIndex('tasks', ['created_at'], {
      name: 'tasks_created_at_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('tasks');
  },
};
