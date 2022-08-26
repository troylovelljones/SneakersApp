const {Sequelize, DataTypes, Model} = require('sequelize');
const colors = require("colors");
const output = require('dotenv').config();
output.error && output.error.message && console.log(output.error.message.red);

const {DATABASE_CONNECTION_STRING} = process.env;
try {
        const sequelize = new Sequelize(DATABASE_CONNECTION_STRING, {
            dialect: 'postgres', 
            dialectOptions: {
                ssl: {rejectUnauthorized: false}
            }});
        module.exports = sequelize;
} catch(e) {
    throw new Error('Database connection failed, make ' .red +
        'sure URL was properly configured.\n URL: '.red.
        concat(!DATABASE_CONNECTION_STRING && 'undefined'.green));
    
}


