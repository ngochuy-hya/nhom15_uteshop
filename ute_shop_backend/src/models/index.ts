import sequelize from '../config/database';
import User from './user';
import OTP from './otp';
import Product from './product';
import Category from './category';

// Định nghĩa quan hệ ở đây
const initializeModels = () => {
  // User.hasMany(OTP, { foreignKey: 'email', sourceKey: 'email' });
  // OTP.belongsTo(User, { foreignKey: 'email', targetKey: 'email' });
  
  // Category associations
  Category.hasMany(Product, {
    foreignKey: 'categoryId',
    as: 'products'
  });
  
  Product.belongsTo(Category, {
    foreignKey: 'categoryId',
    as: 'category'
  });
  
  // Category self-reference for parent/child
  Category.hasMany(Category, {
    foreignKey: 'parentId',
    as: 'children'
  });
  
  Category.belongsTo(Category, {
    foreignKey: 'parentId',
    as: 'parent'
  });
};

initializeModels();

export {
  sequelize,
  User,
  OTP,
  Product,
  Category
};
