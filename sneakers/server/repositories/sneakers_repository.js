const SNEAKER_APP_DB = '../../../core/server/repositories/sneakers_app_database';
const POSTGRESQL_UTILS = '../../../core/server/repositories/utils/postgresql_utilities'
const sequelize = require(SNEAKER_APP_DB);
const {createSqlSelectStatement} = require(POSTGRESQL_UTILS);
const {QueryTypes} = require("sequelize");
const showResultsInConsole = true;
const TEST = true;

const createBaseSneakerQuery = () => {
    return createSqlSelectStatement(['sneakers'], 
        ['price', 'sneaker_name', 'thumbnail_image', 'reseller_name','goat_product_id']).
        rightJoin('sneaker_prices').
        on('sneakers.id', 'sneaker_prices.sneaker_id').
        leftJoin('resellers').
        on('resellers.id', 'sneaker_prices.reseller_id').save();
}
const jordansQuery = createBaseSneakerQuery().
    where('sneaker_name').
    isLike('Jordan%').
    groupBy(['price', 'sneaker_name', 'thumbnail_image', 'reseller_name','goat_product_id']).
    orderBy('sneaker_name');

const sneakerQuery = createBaseSneakerQuery();
    

const alwaysReturnTrue = (value) => {
    return true;
}

const sneakers = {
    getSneakers: async (limit, options) => {
        showResultsInConsole && console.log(`Getting sneakers with a name like ${options.likeSneakerName}`);
        let sqlSelectStatement = sneakerQuery.reset();
        console.log('Like value ' + options?.likeSneakerName);
        sqlSelectStatement =  options?.likeSneakerName && sqlSelectStatement.
            where('sneaker_name').
            isLike(options.likeSneakerName + '%').
            groupBy(['price', 'sneaker_name', 'thumbnail_image', 'reseller_name','goat_product_id']).
            orderBy('sneaker_name').
            limit(limit).
            get() || sneakerQuery.get();

      
        showResultsInConsole && console.log(`Executing query `.cyan) && alwaysReturnTrue(console.log(sqlSelectStatement).magenta);

        const results = await sequelize.query(sqlSelectStatement, {type: QueryTypes.SELECT});

        console.log(`Returned ` + `${results.length}`.green + `records from the query`);

        return results;   
        
    },

    getJordans: async(limit) => {
        showResultsInConsole && console.log('Getting Jordans');
        //showResultsInConsole && console.log('SQL to get sneakers') && alwaysReturnTrue(console.log(sneakerSelect.reset().get()));
        const results = await sequelize.query(jordansQuery.
            limit(limit).
            get(),
            {type: QueryTypes.SELECT});
        console.log(`Returned ` + `${results.length}`.green + `records from the query`);
        return results;
         
    }
}

module.exports = {sneakers};
