
const colors = require('colors');
const SneakerBrandImport = require('./sneaker_brands_import_repository');
const ReleaseYear = require('./release_year_repository');
const ResellerImport = require('./resellers_import_repository');
const ResellLinkImport = require('./resell_links_import_repository');
const SneakerImport = require('./sneakers_import_repository');
const sequelize = require('./sneakers_app_database');
const sneakersETL = require('./sneakersETL');
const {createInsertRecord} = require('./repository_utilities');

const HTTP_PROTOCOL_STR = 'https://';

(async () => { 
    await sequelize.sync({alter: false, force: false});
})();



const extractResellerUrl = (url) => {
    url = (!url && 'none') || url;
    const start = url.indexOf(HTTP_PROTOCOL_STR) + HTTP_PROTOCOL_STR.length;
    const end = url.indexOf('/', start)
    return url.slice(start, end);
}


const extractSneakerData = async (products) => {
    const sneakerImportRecords = [];
    const resellerImportRecords = [];
    const sneakerBrandImportRecords = [];

    for (const product of products) {
        
        console.log('Looping through products json.'.yellow)
        //get the reseller info
        //{resellerA: priceA, resellerB: priceB, resellerC: priceC, etc.}
        sneakerBrandImportRecords.push({brandName: product.brand});
        let link = '';
        console.log(`Reseller Links: ${product.resellLinks}`.blue);
        for (const reseller in product.resellLinks) {
            link = product.resellLinks[reseller];
            //we only want the string properties on the Reseller Links object
            if ( typeof link != 'string' ) continue;
            console.log(`Reseller: ${reseller.toUpperCase()} Reseller url = ${extractResellerUrl(link)}`.green);
            resellerImportRecords.push({resellerName: reseller.toUpperCase(), resellerUrl: extractResellerUrl(link)})    
        }
        console.log(`Resellers to insert: ${resellerImportRecords}`.rainbow);
        let trackedData = ['imageLinks', 'shoeName', 'styleID', 'colorway',
                'retailPrice', 'thumbnail', 'releaseDate', 'description', 'goatProductId','brand']; 
        sneakerImportRecords.push(createInsertRecord(product, trackedData));   
        console.log(`Created insert record sneaker with product id ${product.goatProductId}`.green);
      

    }

    try {
        await SneakerImport.bulkCreate(sneakerImportRecords);
        await ResellerImport.bulkCreate(resellerImportRecords);
        await SneakerBrandImport.bulkCreate(sneakerBrandImportRecords);
    } catch(e) {
        console.log('\n' + e);
        throw new Error('Something terrible happened! Import failed'.red)
    } 
    
}


const beginSneakerETL = async() => {
   
    const numResults = 500;
    console.log('Data synced, calling ETL'.blue);
    console.log(`Loding top ${numResults} most popular shoe(s)...`.cyan);
    //getMostPopular(limit, callback) takes in a limit and 
    //returns an array of the current popular products curated by StockX
    sneakersETL("", numResults, (err, products) => {
        console.log(`\nWeb Scraper succefullyreturned ${products.length} `
        + `product(s).\n`.green.underline.bold);
        extractSneakerData(products).then((value) => 
            console.log('Data import complete'));
    });
    
}

(async () => { 
    await sequelize.sync({alter: false});
})();

beginSneakerETL();


