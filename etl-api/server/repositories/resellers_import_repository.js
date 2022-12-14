const sequelize = require('../../../core/server/repository/sneakers_app_database');
const COMMA = `,`;
const LOCK_TABLE = `LOCK TABLE resellers_import IN EXCLUSIVE MODE; `;
const INSERT_RECORD = `INSERT INTO resellers_import (id, reseller_name, reseller_url, created_at, updated_at) ` +
    `VALUES `;
const VALUES = `(DEFAULT, '?', '?', LOCALTIMESTAMP, LOCALTIMESTAMP) `;

const ResellerImport = {name: 'ResellerImport'};
//shadow the orignal Model.bulkCreate() method because it does not work
ResellerImport.bulkCreate = async (records) => {
    let queryString = LOCK_TABLE + INSERT_RECORD;
    let resellers = new Set();

    for (const record of records) {
        if (resellers.has(record.resellerName)) continue;
        resellers.add(record.resellerName);
        queryString = queryString != (LOCK_TABLE + INSERT_RECORD)  && queryString.concat(COMMA) || queryString;
        queryString = queryString.concat(VALUES).replace('?', record.resellerName).
                replace('?', record.resellerUrl);
       
    }
    console.log(`Executing query: ${queryString}`);
    await sequelize.query(queryString, 
        {type: sequelize.QueryTypes.INSERT});      
}


module.exports = ResellerImport;



