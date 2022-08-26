const sequelize = require('./sneakers_app_database'); 
const Sneaker = require('./sneakers_import_repository'); 
const { getStringColumnType } = require('./repository_utilities');

const COMMA = `,`;
const LOCK_TABLE = `LOCK TABLE sneaker_brands_import IN EXCLUSIVE MODE; `;
const INSERT_RECORD = `INSERT INTO sneaker_brands_import (id, brand_name, created_at, updated_at) ` +
    `VALUES `;
const VALUES = `(DEFAULT, '?', LOCALTIMESTAMP, LOCALTIMESTAMP) `;

const SneakerBrandImport = sequelize.define(`sneaker_brands_import`, {
    brandName: getStringColumnType('brand_name', 50, false),
}, {timestamps: true,
    createdAt: "created_at", // alias createdAt as created_date
    updatedAt: "updated_at",
    tableName: 'sneaker_brands_import'});


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


//establish associations
//each sneaker can only have one 
//sneaker brand e.g. Air Jordan 4's =>
//Jordan
//Sneaker.belongsTo(SneakerBrand,{

  //      foreignKey: 'brand_id',

 //});
//one sneaker brand can describe multiple 
//sneakers e.g. Jordan => Air Jordan 3's, 
//Air Jordan 5's, etc.
//SneakerBrand.hasMany(Sneaker);

module.exports = SneakerBrandImport;

