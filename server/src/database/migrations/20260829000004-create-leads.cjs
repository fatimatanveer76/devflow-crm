'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('leads', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING(150),
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      phone: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      company: {
        type: Sequelize.STRING(150),
        allowNull: true,
      },
      source: {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: 'website',
      },
      status: {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: 'new',
      },
      priority: {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: 'medium',
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

    await queryInterface.addIndex('leads', ['status'], {
      name: 'leads_status_idx',
    });
    await queryInterface.addIndex('leads', ['priority'], {
      name: 'leads_priority_idx',
    });
    await queryInterface.addIndex('leads', ['source'], {
      name: 'leads_source_idx',
    });
    await queryInterface.addIndex('leads', ['assigned_user_id'], {
      name: 'leads_assigned_user_id_idx',
    });
    await queryInterface.addIndex('leads', ['created_by_id'], {
      name: 'leads_created_by_id_idx',
    });
    await queryInterface.addIndex('leads', ['created_at'], {
      name: 'leads_created_at_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('leads');
  },
};
