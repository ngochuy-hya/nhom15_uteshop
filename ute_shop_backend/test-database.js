const mysql = require('mysql2/promise');
require('dotenv').config();

async function testDatabaseConnection() {
  console.log('🔍 Testing UTEShop Database Connection...\n');

  const config = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'uteshop'
  };

  console.log('📋 Database Configuration:');
  console.log(`   Host: ${config.host}`);
  console.log(`   Port: ${config.port}`);
  console.log(`   User: ${config.user}`);
  console.log(`   Database: ${config.database}\n`);

  let connection;

  try {
    // Test connection
    console.log('🔌 Testing connection...');
    connection = await mysql.createConnection(config);
    console.log('✅ Database connection successful!\n');

    // Test database exists
    console.log('🗄️ Checking database...');
    const [databases] = await connection.execute('SHOW DATABASES LIKE ?', [config.database]);
    if (databases.length === 0) {
      console.log('❌ Database does not exist!');
      console.log('💡 Please run the database_setup.sql file first.');
      return;
    }
    console.log('✅ Database exists!\n');

    // Test tables
    console.log('📊 Checking tables...');
    const [tables] = await connection.execute('SHOW TABLES');
    console.log(`Found ${tables.length} tables:`);
    tables.forEach(table => {
      const tableName = Object.values(table)[0];
      console.log(`   - ${tableName}`);
    });
    console.log('');

    // Check users table
    if (tables.some(table => Object.values(table)[0] === 'users')) {
      const [users] = await connection.execute('SELECT COUNT(*) as count FROM users');
      console.log(`👥 Users table: ${users[0].count} records`);
      
      const [userData] = await connection.execute('SELECT id, email, fullName, isVerified FROM users LIMIT 3');
      console.log('Sample users:');
      userData.forEach(user => {
        console.log(`   - ${user.email} (${user.fullName}) - ${user.isVerified ? 'Verified' : 'Unverified'}`);
      });
      console.log('');
    }

    // Check otps table
    if (tables.some(table => Object.values(table)[0] === 'otps')) {
      const [otps] = await connection.execute('SELECT COUNT(*) as count FROM otps');
      console.log(`🔐 OTPs table: ${otps[0].count} records`);
      
      const [otpData] = await connection.execute('SELECT email, type, expiresAt FROM otps LIMIT 3');
      console.log('Sample OTPs:');
      otpData.forEach(otp => {
        const isExpired = new Date(otp.expiresAt) < new Date();
        console.log(`   - ${otp.email} (${otp.type}) - ${isExpired ? 'Expired' : 'Valid'}`);
      });
      console.log('');
    }

    // Test Sequelize models (if available)
    console.log('🧪 Testing Sequelize models...');
    try {
      const { sequelize, User, OTP } = require('./dist/models/index.js');
      
      // Test User model
      const userCount = await User.count();
      console.log(`✅ User model: ${userCount} records`);
      
      // Test OTP model
      const otpCount = await OTP.count();
      console.log(`✅ OTP model: ${otpCount} records`);
      
      await sequelize.close();
    } catch (error) {
      console.log('⚠️ Sequelize models not available (run npm run build first)');
    }

    console.log('🎉 All tests passed! Database is ready for use.');

  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error(`   Error: ${error.message}`);
    console.error('\n🔧 Troubleshooting tips:');
    console.error('   1. Make sure MySQL is running');
    console.error('   2. Check your .env file configuration');
    console.error('   3. Verify database credentials');
    console.error('   4. Run database_setup.sql to create database and tables');
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the test
testDatabaseConnection().catch(console.error);
