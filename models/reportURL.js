const Sequelize = require('sequelize');
const sequelize = require('../utils/database');

const reportURL = sequelize.define('reporturl', {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    Url: {
        type: Sequelize.STRING
    }
});

module.exports = reportURL;