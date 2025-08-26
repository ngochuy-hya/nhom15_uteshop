import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import { UserAttributes } from '../types';

class User extends Model<UserAttributes> implements UserAttributes {
  public id!: number;
  public email!: string;
  public password!: string;
  public fullName!: string;
  public phone?: string;
  public address?: string;
  public avatar?: string;
  public isVerified!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: {
        name: 'unique_email',
        msg: 'Email đã được sử dụng'
      },
      validate: {
        isEmail: {
          msg: 'Email không hợp lệ'
        }
      }
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    fullName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        len: {
          args: [2, 100],
          msg: 'Tên phải có từ 2 đến 100 ký tự'
        }
      }
    },
    phone: {
      type: DataTypes.STRING(15),
      allowNull: true,
      validate: {
        isNumeric: {
          msg: 'Số điện thoại chỉ được chứa số'
        }
      }
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    avatar: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: null,
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    timestamps: true,
    underscored: false,
    paranoid: false,
    indexes: [
      {
        unique: true,
        fields: ['email']
      }
    ]
  }
);

export default User;