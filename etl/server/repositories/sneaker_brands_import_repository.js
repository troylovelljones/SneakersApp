const sequelize = require('../../../core/server/repository/sneakers_app_database');

const COMMA = `,`;
const LOCK_TABLE = `LOCK TABLE sneaker_brands_import IN EXCLUSIVE MODE; `;
const INSERT_RECORD = `INSERT INTO sneaker_brands_import (id, brand_name, created_at, updated_at) ` +
    `VALUES `;
const VALUES = `(DEFAULT, '?', LOCALTIMESTAMP, LOCALTIMESTAMP) `;

const SneakerBrandImport = {name: 'SneakerBrandImport'};

SneakerBrandImport.bulkCreate = async (records) => {
    let queryString = LOCK_TABLE + INSERT_RECORD;
    let brands = new Set();
 
    for (const record of records) {
        if (brands.has(record.brandName)) continue;
        brands.add(record.brandName);
        queryString = queryString != (LOCK_TABLE + INSERT_RECORD)  && queryString.concat(COMMA) || queryString;
        queryString = queryString.concat(VALUES).replace('?', record.brandName);
       
    }
    console.log(`Executing query: ${queryString}`);
    try {
        await sequelize.query(queryString, 
            {type: sequelize.QueryTypes.INSERT});  
    }   
    catch(e) {
        console.log(e);
        throw new Error(`The following query caused a problem: SBI-ERROR: 1000: ${queryString}`);
    } 
}    

module.exports = SneakerBrandImport;

