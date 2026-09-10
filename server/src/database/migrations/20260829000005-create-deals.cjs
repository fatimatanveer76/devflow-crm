'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('deals', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      title: {
        type: Sequelize.STRING(200),
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
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
      value: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0.00,
      },
      currency: {
        type: Sequelize.STRING(10),
        allowNull: false,
        defaultValue: 'USD',
      },
      stage: {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: 'qualification',
      },
      probability: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 20,
      },
      expected_close_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      status: {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: 'open',
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

    await queryInterface.addIndex('deals', ['stage'], {
      name: 'deals_stage_idx',
    });
    await queryInterface.addIndex('deals', ['status'], {
      name: 'deals_status_idx',
    });
    await queryInterface.addIndex('deals', ['lead_id'], {
      name: 'deals_lead_id_idx',
    });
    await queryInterface.addIndex('deals', ['assigned_user_id'], {
      name: 'deals_assigned_user_id_idx',
    });
    await queryInterface.addIndex('deals', ['created_by_id'], {
      name: 'deals_created_by_id_idx',
    });
    await queryInterface.addIndex('deals', ['created_at'], {
      name: 'deals_created_at_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('deals');
  },
};
