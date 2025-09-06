import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

export interface CategoryAttributes {
  id: number;
  name: string;
  description?: string;
  slug: string;
  parentId?: number;
  image?: string;
  icon?: string;
  status: 'active' | 'inactive';
  sortOrder: number;
  createdAt?: Date;
  updatedAt?: Date;
}

class Category extends Model<CategoryAttributes> implements CategoryAttributes {
  public id!: number;
  public name!: string;
  public description?: string;
  public slug!: string;
  public parentId?: number;
  public image?: string;
  public icon?: string;
  public status!: 'active' | 'inactive';
  public sortOrder!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Category.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        len: {
          args: [1, 100],
          msg: 'Tên danh mục phải có từ 1 đến 100 ký tự'
        }
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    slug: {
      type: DataTypes.STRING(120),
      allowNull: false,
      unique: {
        name: 'unique_slug',
        msg: 'Slug đã tồn tại'
      }
    },
    parentId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: {
        model: 'categories',
        key: 'id'
      }
    },
    image: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    icon: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      allowNull: false,
      defaultValue: 'active',
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    modelName: 'Category',
    tableName: 'categories',
    timestamps: true,
    underscored: false,
    paranoid: false,
    indexes: [
      {
        fields: ['parentId']
      },
      {
        fields: ['status']
      },
      {
        fields: ['sortOrder']
      },
      {
        unique: true,
        fields: ['slug']
      }
    ]
  }
);

export default Category;
