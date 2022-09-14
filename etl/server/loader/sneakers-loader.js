"use strict"

const colors = require('colors');
//data import objects
const SneakerBrandImport = require('../repositories/sneaker_brands_import_repository');
const ResellerImport = require('../repositories/resellers_import_repository');
const SneakerImport = require('../repositories/sneakers_import_repository');
const SneakerPriceImport = require('../repositories/sneaker_prices_import_repository');
const SneakerPriceBySizeImport = require('../repositories/sneaker_prices_by_size_import');
const sneakersETL = require('../loader/sneakers-etl');

const HTTP_PROTOCOL_STR = 'https://';
const throwError = (message) => {throw new Error(message.red)};
const logProgress = true;

const extractResellerUrl = (url) => {
    url = (!url && 'none') || url;
    const start = url.indexOf(HTTP_PROTOCOL_STR) + HTTP_PROTOCOL_STR.length;
    const end = url.indexOf('/', start)
    return url.slice(start, end);
}

const logProgressToConsole = (message, color = 'white') => {
    logProgress && typeof message === 'sring' && console.log(message[color]);
    logProgress && typeof message !== 'string'  && console.log(message);
    return true;
}

const extractGeneralSneakerData = async (products, importData, logProgress = false) => {
    
    logProgressToConsole('Data to import');
    if (!importData || Object.keys(importData).length < 1) return;
    const importSet = new Set(importData);
    //Sneakers and brands need to be imported together
    importData.includes('Sneakers') && importSet.push('Brands');   
    logProgressToConsole(importSet);
    //loader will conitionally load data based on importData contents
    const importSneakerData = importData.includes('Sneaker');
    const importResellerData = importData.includes('Reseller');
    const importBrandData = importData.includes('Brand');
    const importPriceData =  importData.includes('Price');
    const messageColor = 'green';
    importSneakerData && logProgressToConsole('Sneaker Data will be imported', messageColor) &&
    importResellerData && logProgressToConsole('Reseller data will be imported', messageColor) &&
    importBrandData && logProgressToConsole('Brand data will be imported', messageColor) &&
    importPriceData && logProgressToConsole('Price data will be imported', messageColor);
   


    logProgress = false;
    const sneakerImportRecords = [];
    const resellerImportRecords = [];
    const brandImportRecords = [];
    const priceImportRecords = [];
    const styles = [];
    
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

            const {styleID, goatProductId, shoeName} = product;
            !styleID && throwError('Missing style id!'.red);
            const style = {};
            style.resellerName = importRecord.reseller_name;
            style.styleID = styleID;
            style.goatProductId = goatProductId;
            style.shoeName = shoeName;
            style.url = importRecord.url;
            style.lowerstResellPrice = importRecord.price;
            styles.push(style);
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
   
    importPriceData && !console.log('Price Import Data..') && console.log(priceImportRecords);
    try { //save etl data to the database
        importSneakerData && await SneakerImport.bulkCreate(sneakerImportRecords);
        importResellerData && await ResellerImport.bulkCreate(resellerImportRecords);
        importBrandData && await SneakerBrandImport.bulkCreate(brandImportRecords);
        //importPriceData && await SneakerPriceImport.bulkCreate(priceImportRecords);
    } catch(e) {
        console.log('\n' + e.stack);
        throw new Error('Something terrible happened! Import failed'.red);
    } 
    return styles
    
}


const priceBySizeImportRecords = [];
const goatIdSizeSet = new Set();
const extractPriceBySize = (style) => {
    console.log('Extracting Prices by Size.')
    return (err, priceMap) => {
        //reseller is the first (and only) property of a price map
        console.log('Map');
        console.log(priceMap);
        if (!priceMap?.resellPrices) return;
        const resellers = Object.keys(priceMap.resellPrices);
        console.log('Resellers');
        console.log(resellers);
        for (const reseller of resellers) {
            const resellPrices = priceMap.resellPrices[reseller];
            if (!resellPrices) continue;
            console.log('Prices');
            console.log(resellPrices);  
            const sizes = Object.keys(resellPrices);
            for (const size of sizes) {
                console.log('Size');
                console.log(size);
                const sneaker = {};
                sneaker.reseller_name = reseller;
                sneaker.goat_product_id = style.goatProductId;
                sneaker.sneaker_name = style.shoeName;
                sneaker.size = size;
                sneaker.style_id = style.styleID
                sneaker.price = resellPrices[size];
                sneaker.url = style.url;
                console.log(sneaker);
                !goatIdSizeSet.has(style.goatProductId+size) && goatIdSizeSet.add(style.goatProductId+size) && priceBySizeImportRecords.push(sneaker);
            }
            
        }
       
    }
    
}

const extractPriceData = async (styles) => {
    console.log('Getting product prices from style id.'.red);
    for (const style of styles) {
        console.log(style);
        !style.styleID && throwError('Missing style id');
        console.log('Reseller info in extractPriceData...');
        console.log('Style Info.');
        console.log(style)
        await sneakersETL.getProductPrices(style.styleID, 
            extractPriceBySize(style));
    }
   

}

const savePriceData = async (sneakers) => {
    try {
        await extractPriceData(sneakers);
        await SneakerPriceBySizeImport.bulkCreate(priceBySizeImportRecords);
    } catch (e) {
        console.log('\n' + e.stack);
        throw new Error('Something terrible happened! Import failed'.red)
    }

}


const beginSneakerETL = async (importData) => {
   
    const numResults = 1000;
    console.log('Data synced, calling ETL'.blue);
    console.log(`Loding top ${numResults} most popular shoe(s)...`.cyan);
    //getMostPopular(limit, callback) takes in a limit and 
    //returns an array of the current popular products curated by StockX
    await sneakersETL.getProducts("", numResults, async (err, products) => {
        console.log(`\nWeb Scraper succefully returned ${products.length} `
        + `product(s).\n`.green.underline.bold);
        await extractGeneralSneakerData(products, importData).then( async (sneakers) => {
            const importPriceDataBySize = importData.includes('Price-By-Size');
            importPriceDataBySize && logProgressToConsole('Price by size data will be imported'.messageColor);
            !console.log(sneakers.length) && sneakers.length < 1 && throwError('No sneakers');
            console.log('almost done');
            importPriceDataBySize && await savePriceData(sneakers)
            console.log('Saved data');
            console.log('Done');
        });
    });    
    
    
    
}


//program cannot complete until ETL is done
(async () => 
    await beginSneakerETL(['Price','Price-By-Size'])
)();

