const sequelize = require('../../../core/server/repositories/sneakers_app_database'); 
const {constructInsertStatement, constructUpdateStatement} = require("../../../core/server/repositories/utils/postgresql_utilities");

const insertSneakers = async (tableName, records) => {
    
    const timestamp = {createdAt: 'created_at', updatedAt: 'updated_at'};

    console.log(`${records.length} record(s) to insert into ${tableName}`.magenta);
    
    const insertStatement = constructInsertStatement(tableName, records, timestamp, 
        {
            mappedProperties: {imageLinks: 'image_link_url', thumbnail: 'thumbnail_image',
                goatProductId: 'goat_product_id', retailPrice: 'original_retail_price',
                shoeName: 'sneaker_name', releaseDate: 'release_date', styleID: 'style_id'},
            treatPropertyValuesAsStrings: ['description', 'imageLinks', 'shoeName']
        });
    
    try {
        await sequelize.query(insertStatement, {type: sequelize.QueryTypes.INSERT_STATEMENT});
    } catch(error) {
        console.log(error);
        throw new Error(`The following query caused a problem: SBI-ERROR: 1000: ${insertStatement}`.red);

    }
    console.log(`Sneaker import successful`.green);



}
const updateSneakers = async (tableName, records, primaryKey) => {
    const updateStatement = constructUpdateStatement(tableName, records, primaryKey);
    await sequelize.query(updateStatement, {type: sequelize.QueryTypes.UPDATE_STATEMENT})
    
}


const SneakerImport = {name: 'SneakerImport'};
SneakerImport.bulkCreate = (records) => insertSneakers(`sneakers_import`, records);
 

module.exports = SneakerImport;
