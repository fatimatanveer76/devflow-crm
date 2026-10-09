import { DataTypes, Model } from 'sequelize';
import { uuidPrimaryKey, createModelOptions } from './baseModel.js';

export class ClientProfile extends Model {}

export const initClientProfile = (sequelize) => {
  ClientProfile.init(
    {
      id: uuidPrimaryKey,
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: {
          name: 'client_profiles_user_id_unique',
          msg: 'A client profile already exists for this user account.',
        },
      },
      company_name: {
        type: DataTypes.STRING(200),
        allowNull: false,
        validate: {
          notEmpty: { msg: 'Company name cannot be empty.' },
          len: { args: [2, 200], msg: 'Company name must be between 2 and 200 characters.' },
        },
      },
      contact_email: {
        type: DataTypes.STRING(255),
        allowNull: true,
        validate: {
          isEmail: { msg: 'Please provide a valid contact email.' },
        },
      },
      contact_phone: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      address: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      industry: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      ...createModelOptions({ tableName: 'client_profiles', paranoid: true }),
      hooks: {
        beforeValidate: (cp) => {
          if (cp.company_name && typeof cp.company_name === 'string') {
            cp.company_name = cp.company_name.trim();
          }
          if (cp.contact_email && typeof cp.contact_email === 'string') {
            cp.contact_email = cp.contact_email.toLowerCase().trim();
          }
        },
      },
    }
  );
  return ClientProfile;
};

export default ClientProfile;
