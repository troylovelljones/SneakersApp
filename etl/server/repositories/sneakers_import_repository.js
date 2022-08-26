const sequelize = require('./sneakers_app_database'); 
const {constructInsertStatement, constructUpdateStatement} = require("./postgresql_utilities");

const {
        getStringColumnType, 
        getIntegerColumnType, 
        getDecimalColumnType, 
        getDateColumnType,
     
    
} = require('./repository_utilities'); 
const { Error } = require('sequelize');
const e = require('cors');

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

const SneakerImport = sequelize.define(`sneakers_import`, {
    brand: getStringColumnType('brand_id'),
    originalReleaseYearId: getIntegerColumnType('original_release_year_id'),
    originalRetailPrice: getDecimalColumnType('original_retail_price'),
    imageLinksUrl: getStringColumnType('image_link_url'),
    thumbNail: getStringColumnType('thumbnail_image'),
    goatProductId: getStringColumnType('goat_product_id', 100),
    description: getStringColumnType('description'),
    releaseDate: getDateColumnType('release_date'),
    styleId: getStringColumnType('style_id', 100),
    shoeName: getStringColumnType('sneaker_name'),
    colorway: getStringColumnType('colorway', 100)
    },{ timestamps: true,
        createdAt: "created_at", // alias createdAt as created_date
        updatedAt: "updated_at",
        tableName: 'sneakers_import'});

    
SneakerImport.bulkCreate = (records) => insertSneakers(`sneakers_import`, records);
 

module.exports = SneakerImport;
