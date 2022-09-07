
const colors = require('colors');
const SneakerBrandImport = require('../repositories/sneaker_brands_import_repository');
const ResellerImport = require('../repositories/resellers_import_repository');
const SneakerImport = require('../repositories/sneakers_import_repository');
const SneakerPriceImport = require('../repositories/sneaker_prices_import_repository')
const sequelize = require('../../../core/server/repositories/sneakers_app_database');
const sneakersETL = require('../loader/sneakers-etl');
const {createInsertRecord} = require('../../../core/server/repositories/utils/repository_utilities');

const HTTP_PROTOCOL_STR = 'https://';

const throwError = (message) => {throw new Error(message.red)};
const extractResellerUrl = (url) => {
    url = (!url && 'none') || url;
    const start = url.indexOf(HTTP_PROTOCOL_STR) + HTTP_PROTOCOL_STR.length;
    const end = url.indexOf('/', start)
    return url.slice(start, end);
}


const extractSneakerData = async (products, dataToImport, logProgress = false) => {
    
    const logProgressToConsole = (message, color = 'white') => {
        logProgress && typeof message === 'sring' && console.log(message[color]);
        logProgress && typeof message !== 'string'  && console.log(message);
        return true;
    }


    logProgressToConsole('Data to import');

    if (!dataToImport || Object.keys(dataToImport).length < 1) return;
    const dataImportSet = new Set(dataToImport);
    //Sneakers and brands need to be imported together
    dataToImport.includes('Sneakers') && dataImportSet.push('Brands');   

    const sneakerImportRecords = [];
    const resellerImportRecords = [];
    const brandImportRecords = [];
    const priceImportRecords = [];

    logProgress = true;
    logProgressToConsole(dataImportSet);
    //loader will conitionally load data based on dataToImport contents
    const importSneakerData = dataToImport.includes('Sneakers');
    const importResellerData = dataToImport.includes('Resellers');
    const importBrandData = dataToImport.includes('Brands');
    const importPriceData =  dataToImport.includes('Prices');
    const messageColor = 'green';
    importSneakerData && 
    logProgressToConsole('Sneaker Data will be imported', messageColor) &&
    importResellerData &&
    logProgressToConsole('Reseller data will be imported', messageColor) &&
    importBrandData &&
    logProgressToConsole('Brand data will be imported', messageColor) &&
    importPriceData &&
    logProgressToConsole('Price data will be imported', messageColor);
    

    logProgress = false;
    
    const extractResellersAndPrices = (product) => {

        //get the reseller info
        //{resellerA: priceA, resellerB: priceB, resellerC: priceC, etc.}

        logProgressToConsole(`Reseller Links: ${product.resellLinks}`.blue);
        for (const reseller in product.resellLinks) {
            
            const link = product.resellLinks[reseller];
            //we only want the string properties on the Reseller Links object
            if ( typeof link != 'string' ) continue;
            logProgressToConsole(`Reseller: ${reseller.toUpperCase()} Reseller url = ${extractResellerUrl(link)}`.green);
            importResellerData && resellerImportRecords.push(
                {
                    resellerName: reseller.toUpperCase(), 
                    resellerUrl: extractResellerUrl(link)
                });
            const importRecord = {

                reseller_name: reseller.toUpperCase(),
                price: product.lowestResellPrice[reseller],
                sneaker_name: product.shoeName,
                url: product.resellLinks[reseller]
            }
            logProgress = true;
            logProgressToConsole('Extracted price record: ');
            console.log(importRecord);
            logProgress = false;
            importPriceData && priceImportRecords.push(importRecord); 

        }
        logProgressToConsole(`Resellers to insert: ${resellerImportRecords}`.rainbow);

    }

    
    for (const product of products) {

        logProgressToConsole('Looping through products json.'.yellow);
        
        //<!-- reseller and price import -->
        (importResellerData || importPriceData) && extractResellersAndPrices(product);
        //<!-- brand import -->
        importBrandData && brandImportRecords.push({brandName: product.brand});
        //<!--- sneaker import -->
        let trackedData = importSneakerData ? ['imageLinks', 'shoeName', 'styleID', 'colorway',
                'retailPrice', 'thumbnail', 'releaseDate', 'description', 'goatProductId','brand'] : null;
        importSneakerData && sneakerImportRecords.push(createInsertRecord(product, trackedData));

    }

    console.log(priceImportRecords);


    try { //save etl data to the database
        importSneakerData && await SneakerImport.bulkCreate(sneakerImportRecords);
        importResellerData && await ResellerImport.bulkCreate(resellerImportRecords);
        importBrandData && await SneakerBrandImport.bulkCreate(brandImportRecords);
        importPriceData && await SneakerPriceImport.bulkCreate(priceImportRecords);

    } catch(e) {
        console.log('\n' + e.stack);
        throw new Error('Something terrible happened! Import failed'.red)
    } 
    
}


const beginSneakerETL = async (dataToImport) => {
   
    const numResults = 500;
    console.log('Data synced, calling ETL'.blue);
    console.log(`Loding top ${numResults} most popular shoe(s)...`.cyan);
    //getMostPopular(limit, callback) takes in a limit and 
    //returns an array of the current popular products curated by StockX
    sneakersETL("", numResults, (err, products) => {
        console.log(`\nWeb Scraper succefully returned ${products.length} `
        + `product(s).\n`.green.underline.bold);
        extractSneakerData(products, dataToImport).then((value) => 
            console.log('Data import complete'));
    });
    
}


beginSneakerETL(['Prices']);

