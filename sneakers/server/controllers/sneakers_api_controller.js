const {sneakers} = require('../repositories/sneakers_repository');
const {sanitizeString} = require('../../../core/data-validation/validation');

const ERROR = `There was an error retrieving sneaker data`.red;
const showResultInConsole = true;
module.exports = {
    getSneakers: async (req, res) => {

        try {
            const limit = req.query.limit;
            const likeSneakerName = req.query.sneakername;
            showResultInConsole && console.log(likeSneakerName, limit);
            const options = {likeSneakerName};
            const results = await sneakers.getSneakers(limit, options);
            showResultInConsole && console.log(`Sneaker results...`) && !console.log(results);
            res.status(200).send(results);
             
          } catch(e) {  
              console.log(ERROR.red);
              console.log(e.stack);  
              res.status(400).send(sanitizeString(ERROR));
              return;
          }
    },
    getJordans: async (req, res) => {

        try {
            const limit = req.params.limit;
            const results = await sneakers.getJordans(limit);
            showResultInConsole && console.log(`Sneaker results...`) && !console.log(results);
            res.status(200).send(results);
             
          } catch(e) {  
              console.log(ERROR.red);
              console.log(e.stack);  
              res.status(400).send(sanitizeString(ERROR));
              return;
          }
    }
}
