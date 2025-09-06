import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

export interface ProductAttributes {
  id: number;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  discountPercent?: number;
  categoryId: number;
  stock: number;
  images: string[];
  thumbnailUrl: string;
  brand?: string;
  sku: string;
  weight?: number;
  dimensions?: string;
  status: 'active' | 'inactive' | 'out_of_stock';
  viewCount: number;
  soldCount: number;
  rating: number;
  reviewCount: number;
  isFeatures: boolean;
  isBestSeller: boolean;
  isNewArrival: boolean;
  tags?: string[];
  specifications?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}

class Product extends Model<ProductAttributes> implements ProductAttributes {
  public id!: number;
  public name!: string;
  public description!: string;
  public price!: number;
  public originalPrice?: number;
  public discountPercent?: number;
  public categoryId!: number;
  public stock!: number;
  public images!: string[];
  public thumbnailUrl!: string;
  public brand?: string;
  public sku!: string;
  public weight?: number;
  public dimensions?: string;
  public status!: 'active' | 'inactive' | 'out_of_stock';
  public viewCount!: number;
  public soldCount!: number;
  public rating!: number;
  public reviewCount!: number;
  public isFeatures!: boolean;
  public isBestSeller!: boolean;
  public isNewArrival!: boolean;
  public tags?: string[];
  public specifications?: Record<string, any>;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Product.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false,
      validate: {
        len: {
          args: [1, 200],
          msg: 'Tên sản phẩm phải có từ 1 đến 200 ký tự'
        }
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    price: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      validate: {
        min: {
          args: [0],
          msg: 'Giá phải lớn hơn 0'
        }
      }
    },
    originalPrice: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
    },
    discountPercent: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
      validate: {
        min: 0,
        max: 100
      }
    },
    categoryId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'categories',
        key: 'id'
      }
    },
    stock: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: {
          args: [0],
          msg: 'Tồn kho không được âm'
        }
      }
    },
    images: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
    },
    thumbnailUrl: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    brand: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    sku: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: {
        name: 'unique_sku',
        msg: 'SKU đã tồn tại'
      }
    },
    weight: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: true,
    },
    dimensions: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'out_of_stock'),
      allowNull: false,
      defaultValue: 'active',
    },
    viewCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    soldCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    rating: {
      type: DataTypes.DECIMAL(3, 2),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
        max: 5
      }
    },
    reviewCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    isFeatures: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    isBestSeller: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    isNewArrival: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    tags: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
    },
    specifications: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {},
    },
  },
  {
    sequelize,
    modelName: 'Product',
    tableName: 'products',
    timestamps: true,
    underscored: false,
    paranoid: false,
    indexes: [
      {
        fields: ['categoryId']
      },
      {
        fields: ['status']
      },
      {
        fields: ['viewCount']
      },
      {
        fields: ['soldCount']
      },
      {
        fields: ['rating']
      },
      {
        fields: ['discountPercent']
      },
      {
        fields: ['createdAt']
      },
      {
        unique: true,
        fields: ['sku']
      }
    ]
  }
);

export default Product;
