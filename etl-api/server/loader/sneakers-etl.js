const colors = require('colors');
const stockXScraper = require('sneaks-api/scrapers/stockx-scraper');
const flightClubScraper = require('sneaks-api/scrapers/flightclub-scraper');
const goatScraper = require('sneaks-api/scrapers/goat-scraper');
const stadiumGoodsScraper = require('sneaks-api/scrapers/stadiumgoods-scraper');

const getProducts = async(keyword, count = 40, callback) =>  {
  var productCounter = 0;
  await stockXScraper.getProductsAndInfo(keyword, count, function (error, products) {
    if (!products) {
      callback(new Error('Serious error.  Products was empty!.'), products); 
      return;
    }
    error && callback(error, null)
    products.forEach(function (shoe) {
      var cbCounter = 0;
      flightClubScraper.getLink(shoe, () =>
      //if all shoes links have been parsed then return  
        ++cbCounter == 3 && 
          productCounter++ + 1 == products.length &&
          callback(null, products)
      );
      stadiumGoodsScraper.getLink(shoe, function () {
        ++cbCounter == 3 &&
        //if all shoes links have been parsed then return
          productCounter++ + 1 == products.length &&
          callback(null, products);
      });

      goatScraper.getLink(shoe, function () {
        ++cbCounter == 3 &&
          //if all shoes links have been parsed then return
          productCounter++ + 1 == products.length &&
            callback(null, products);
      });
    });
  });
}

module.exports = {

  getProducts,  
  getProductPrices: async (shoeID, callback) => {
    
    const getPrices = async (shoe) => {
        var cbCounter = 0;
        await stockXScraper.getPrices(shoe, function () {
          cbCounter++ && 
            cbCounter == 5 && 
            callback(null, shoe)
          }
        );
        
        await stadiumGoodsScraper.getPrices(shoe, function () {
          cbCounter++ &&
            cbCounter == 5 &&
            callback(null, shoe)
          }
        );
        
        await flightClubScraper.getPrices(shoe, function () {
          cbCounter++ &&
            cbCounter == 5 &&
            callback(null, shoe)
        });
        
        await goatScraper.getPrices(shoe, function () {
          cbCounter++ &&
            cbCounter == 5 &&
            callback(null, shoe)
        });

        await goatScraper.getPictures(shoe, function () {
          cbCounter++ &&
            cbCounter == 5 &&
            callback(null, shoe)
          });

      }
      
      await getProducts(shoeID, 1, async function (error, products) {
          if (error || !products[0] || !shoeID || products[0].styleID.toLowerCase() != shoeID.toLowerCase()) {
            console.log(new Error("No Products Found"));
            callback(new Error("No Products Found"), null);
            return;
          }
  
          await getPrices(products[0]);
      });
  
    },
  
    getMostPopular(count, callback) {
      getProducts("", count, function (error, products) {
        if (error) {
          callback(error, null);
        } else {
          callback(null, products)
        }
      });
    }

  
  }
