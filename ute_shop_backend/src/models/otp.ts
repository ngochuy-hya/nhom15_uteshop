import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import { OTPAttributes } from '../types';

class OTP extends Model<OTPAttributes> implements OTPAttributes {
  public id!: number;
  public email!: string;
  public otp!: string;
  public type!: 'register' | 'forgot-password';
  public expiresAt!: Date;
  public readonly createdAt!: Date;
}

OTP.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        isEmail: {
          msg: 'Email không hợp lệ'
        }
      }
    },
    otp: {
      type: DataTypes.STRING(6),
      allowNull: false,
      validate: {
        len: {
          args: [6, 6],
          msg: 'OTP phải có 6 ký tự'
        },
        isNumeric: {
          msg: 'OTP chỉ được chứa số'
        }
      }
    },
    type: {
      type: DataTypes.ENUM('register', 'forgot-password'),
      allowNull: false,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'OTP',
    tableName: 'otps',
    timestamps: true,
    updatedAt: false,
    underscored: false,
    indexes: [
      {
        fields: ['email', 'type']
      },
      {
        fields: ['expiresAt']
      }
    ]
  }
);

export default OTP;