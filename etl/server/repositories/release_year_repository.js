const sneakersAppDatabase = require('./sneakers_app_database'); 
const { getIntegerColumnType } = require('./repository_utilities');

const ReleaseYear = sneakersAppDatabase.define(`release_years`, {

    releaseYear: getIntegerColumnType('year'),

},{ timestamps: true,
    createdAt: "created_at", // alias createdAt as created_date
    updatedAt: "updated_at"});

module.exports = ReleaseYear;

    
