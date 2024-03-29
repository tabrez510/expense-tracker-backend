const Sequelize = require('sequelize');

const sequelize = new Sequelize(process.env.DB_NAME || 'expense-tracker' , process.env.DB_USER || 'root', process.env.DB_PASSWORD || '8574421120', {
    dialect: 'mysql',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || '3306' // Specify the port here
  });

module.exports = sequelize;