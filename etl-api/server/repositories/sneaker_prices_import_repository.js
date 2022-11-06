const sequelize = require('../../../core/server/repository/sneakers_app_database'); 
const {createSqlInsertStatement} = require('../../../core/server/repository/utils/postgresql_utilities');

const COMMA = `,`;
const LOCK_TABLE = `LOCK TABLE sneaker_prices_import IN EXCLUSIVE MODE; `;
const BATCH_SIZE = 100;
const showLogStatements = true;

const sneakerPricesImport = {
    bulkCreate: async (prices) => {
        const t = await sequelize.transaction();
        let sqlInsertStatement;
        try {
                let recordsInserted = 0;
                for (let batch = 0; batch < Math.ceil(prices.length / BATCH_SIZE); batch++) {
                    //if there are 100 price records, we should get one batch with an array of prices from price 0 to price 99
                    //if there are 251 price records, we should get one batch with an array of prices from price 0 - price 249
                    //and a second batch with any array of prices from price 250 to price 251 
                    const batchStart = batch * BATCH_SIZE;
                    let pricesBatch = prices.slice(batchStart,  batchStart + BATCH_SIZE);
                    if (pricesBatch.length < 1) continue;
                    sqlInsertStatement =
                        createSqlInsertStatement('sneaker_prices_import', pricesBatch, {timestamps: {includeDefaultTimestampFields: true}});
                    showLogStatements && console.log(`Executing query: ${sqlInsertStatement}`);
                    await sequelize.query(sqlInsertStatement, 
                        {type: sequelize.QueryTypes.INSERT}); 
                    recordsInserted += pricesBatch.length;
                    showLogStatements && console.log(`Inserted batch ${batch + 1}`.green + `of ${pricesBatch.length}`.cyan + `records`.green);

                }   
                //check the number of records inserted, if the total is off raise an error 
                if (recordsInserted !== prices.length) throw new Error(`Invalid record insertion count ` +  `${recordsInserted}`.blue + ` != `.yellow + `${prices.length}`.cyan); 
                t.commit();
                showLogStatements && console.log(`${recordsInserted} records inserted.`.green);
            } catch(e) {
                console.log(e.stack);
                t.rollback();
                throw new Error(`The following insert query caused a problem: SBI-ERROR: 1000:`.red + `${sqlInsertStatement}`.magenta);             
        
            }  

    }
}

module.exports = sneakerPricesImport;




