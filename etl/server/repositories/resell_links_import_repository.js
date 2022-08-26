const sneakersAppDatabase = require('./sneakers_app_database'); 

const COMMA = `,`;
const LOCK_TABLE = `LOCK TABLE reseller_links IN EXCLUSIVE MODE; `;
const INSERT_RECORD = `INSERT INTO reseller_links (id, reseller_id, sneaker_id, url, created_at, updated_at) ` +
    `VALUES `;
const VALUES = `(DEFAULT, ?, ?, '?', LOCALTIMESTAMP, LOCALTIMESTAMP) `;
const {
    getStringColumnType, 
    getIntegerColumnType, 
    getDecimalColumnType,

} = require('./repository_utilities');

const Reseller = require('./resellers_import_repository');
const Sneaker = require('./sneakers_import_repository');

const ResellLinkImport = sneakersAppDatabase.define(`resell_links_import`, {
    
    reseller_id: getIntegerColumnType('reseller_id'),
    sneakerId: getIntegerColumnType('sneaker_id'),
    url: getStringColumnType('url'),
    price: getDecimalColumnType('price'),

}, {timestamps: true,
    createdAt: "created_at", // alias createdAt as created_date
    updatedAt: "updated_at",
    tableName: 'reseller_links_import'});

ResellLinkImport.bulkCreate = async (records) => {
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

module.exports = ResellLinkImport;


