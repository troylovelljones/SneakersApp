const db = require('./databases/postgresql/postgresql-database');
const {createSqlSelectStatement, createSqlInsertStatement} = require('./utils/postgresql-utils');
const {QueryTypes} = require("sequelize");
const { throwError } = require('../../validation/validation');
const { error, log, getModuleLoggingMetaData } = require('../../../logging/logger/global-logger')(module);

let transaction;

module.exports = {


    commit: async () => {
        !transaction && throwError('No transaction in progress!');
        await transaction.commit();
        transaction = null;
    },
    
    getSneakerUserById : async (id) => {
        const result = await db.query(createSqlSelectStatement('users', ['username', 
            'profile_image', 'admin', 'last_login_at']).
            where('id').
            isEqualTo(id).get(),
            {type: QueryTypes.SELECT});
        log(result.values());
        return result.values();
    },

    getSneakerUserByUserName: async (username) => {
        try {
            const selectStatement = createSqlSelectStatement('users', ['id', 'username', 
            'profile_image', 'last_login_at']).
                where('username').
                isEqualTo(username).get();
            log('SQL statement = ');
            log(selectStatement);
            log(`Running query to find ${username}: `.green);
            const result = await db.query(selectStatement,
            {type: QueryTypes.SELECT});
            log(`Query results = ${JSON.stringify(result)}.`);
            log(`Results for ${username}: `.red + JSON.stringify(result, null, 2));
            return result;
            } catch(e) {
                error('sql statement failed!!')
                error(e.stack);

            }
        

    },

    getUserAccessToken: async (userId) => {
        const selectStatement = createSqlSelectStatement('user', ['access_token']).
            where('user_id').
            isEqualTo(userId).get();
        const result = await sequelize.db(selectStatement, {type: QueryTypes.SELECT});
        log(result.values());
        return result.values();
            
            
    },

    getUserRefreshToken: async (userId) => {
        const selectStatement = createSqlSelectStatement('user',['refresh_token']).
            where('user_id').
            isEqualTo(userId).get();
        const result = await sequelize.db(selectStatement, {type: QueryTypes.SELECT});
        log(result);
        return result;
        
    },

    insertSneakerUser: async (user) =>{
        log(`User record: `.gray);
        log(user);
        const insertRecord = 
            createSqlInsertStatement('users', user, //include timestamps
                {
                    mappedProperties: {emailAddress: 'email_address'}, //map email field
                    timestamps: {includeDefaultTimestampFields: true},
                    returning: true
                });
        log(`Insert record: `.magenta + `${insertRecord}`.green.italic.bold);
        const result = await db.query(insertRecord, {type: QueryTypes.INSERT, transaction});
        log('Record inserted!');
        log(result);
        return result[0][0];
      
    },

    rollback: async () => {
        !transaction && throwError('There is no transaction in progress.');
        await transaction.rollback();
    },

    startTransaction: async () => {
        transaction && throwError('There is already a transaction in progress.');
        transaction = await db.transaction();
        
    },

    updateSneakerUser: async (user) => {
        const updateStatement = 
            createSqlUpdateStatement('users', user, {timestamps: {udpdated_at}}).
            where('user_id').
            isEqualTo(id).get();
        log(updateStatement);
        const result = await sequelize.db(updateStatement, {type: QueryTypes.UPDATE});
        log(result.values());
        return result.values();
    }         
}


