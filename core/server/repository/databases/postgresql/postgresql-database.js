"use strict";

const { Sequelize } = require('sequelize');
const colors = require("colors");
const output = require('dotenv').config();
output.error && output.error.message && console.log(output.error.message.red);
const { error, log } = require('../../../../../logging/logger/global-logger')(module);

const {DATABASE_CONNECTION_STRING} = process.env;

const getConnection = () => {

    try {
        log('Getting a database connection.');
        const sequelize = new Sequelize(DATABASE_CONNECTION_STRING, {
            dialect: 'postgres', 
            dialectOptions: {
                ssl: {rejectUnauthorized: false}
            }});
        log('Database connection = ');
        log(sequelize);
        return sequelize;
    } catch(e) {
        error(output || 'Empty .env file.');
        throw new Error('Database connection failed, make sure URL was properly configured.\n URL: '
            .concat(!DATABASE_CONNECTION_STRING && 'undefined'.red));
    }
    
}

module.exports = getConnection;




