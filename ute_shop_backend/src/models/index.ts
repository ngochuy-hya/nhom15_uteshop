import sequelize from '../config/database';
import User from './user';
import OTP from './otp';

// Định nghĩa quan hệ ở đây
const initializeModels = () => {
  // User.hasMany(OTP, { foreignKey: 'email', sourceKey: 'email' });
  // OTP.belongsTo(User, { foreignKey: 'email', targetKey: 'email' });
};

initializeModels();

export {
  sequelize,
  User,
  OTP
};
