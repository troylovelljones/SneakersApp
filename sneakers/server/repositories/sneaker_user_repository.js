
const SNEAKER_APP_DB = '../../../core/server/repository/sneakers_app_database';
const POSTGRESQL_UTILS = '../../../core/server/repository/utils/postgresql_utilities'
const sequelize = require(SNEAKER_APP_DB);
const {createSqlSelectStatement, createSqlInsertStatement} = require(POSTGRESQL_UTILS);
const {QueryTypes} = require("sequelize");
const showSql = true;
const TEST = true;


module.exports = {

   getSneakerUserById : async (id) => {
        const result = await sequelize.query(createSqlSelectStatement('users', ['username', 'password', 
            'profile_image', 'last_login_at']).
            where('id').
            isEqualTo(id).get(),
            {type: QueryTypes.SELECT});

        console.log(result.values());
        return result.values();
    },

    getSneakerUserByUserName: async (username) => {
        const selectStatement = createSqlSelectStatement('users', ['username', 'password', 
            'profile_image', 'last_login_at']).
        where('username').
        isEqualTo(username).get();
        showSql && console.log(selectStatement);
        TEST && console.log(`Running query to find ${username}: `.green);
        const result = await sequelize.query(selectStatement,
            {type: QueryTypes.SELECT});
        
        TEST && console.log(`Results for ${username}: `.red + result.values());
        return result.values();

    } ,

    
    insertSneakerUser: async (user) =>{
        console.log(`User record: `.gray);
        console.log(user);
        const insertRecord = 
            createSqlInsertStatement('users', user, //include timestamps
                {mappedProperties: {email: 'email_address'}, timestamps: {defaultTimestampFields: true}}); //map email & password fields
        showSql && console.log(`Insert record: `.magenta + `${insertRecord}`.green.italic.bold);
        const result = await sequelize.query(insertRecord, {type: QueryTypes.INSERT});
        TEST && console.log(result.values());
        return result.values();
    },

    updateSneakerUser: async (user) => {
        const {username, id, email, password: encryptedPassword} = user;
        const updateStatement = 
            createSqlUpdateStatement('users', 
                {username, email, password, emailaddress},
                {mappedProperties: {email: 'email_address'}}, 
                {serverTimestamps: true}).
            where('user_id').
            isEqualTo(id).get();
        showSql && console.log(updateStatement);
        const result = await sequelize.query(updateStatement, {type: QueryTypes.UPDATE});
        TEST && console.log(result.values());
        return result.values();
    }
            
    
    
}


