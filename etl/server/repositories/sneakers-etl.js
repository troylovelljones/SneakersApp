const stockXScraper = require('sneaks-api/scrapers/stockx-scraper');
const flightClubScraper = require('sneaks-api/scrapers/flightclub-scraper');
const goatScraper = require('sneaks-api/scrapers/goat-scraper');
const stadiumGoodsScraper = require('sneaks-api/scrapers/stadiumgoods-scraper');

module.exports = sneakersETL = async(keyword, count = 40, callback) =>  {

    var productCounter = 0;
    stockXScraper.getProductsAndInfo(keyword, count, function (error, products) {
      if (error) {
        callback(error, null)
      }
      products.forEach(function (shoe) {
        var cbCounter = 0;
        flightClubScraper.getLink(shoe, function () {
          if (++cbCounter == 3) {
            //if all shoes links have been parsed then return
            if (productCounter++ + 1 == products.length) {
              callback(null, products);
            }

          }
        });

        stadiumGoodsScraper.getLink(shoe, function () {
          if (++cbCounter == 3) {
            //if all shoes links have been parsed then return
            if (productCounter++ + 1 == products.length) {
              callback(null, products);
            }

          }
        });

        goatScraper.getLink(shoe, function () {
          if (++cbCounter == 3) {
            //if all shoes links have been parsed then return
            if (productCounter++ + 1 == products.length) {
              callback(null, products);
            }

          }
        });
      });

    });


  }