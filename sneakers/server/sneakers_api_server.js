const {startExpressApplicationServer} = require('../../core/server/basic-express-server/expressAppServer');
//const {mountSubApp} = require('../../core/server/main-server');
const {router, apiServerUrl} = require("./routes/sneakers_api_routes");
const colors = require("colors");
const express = require('express');

const sneakersApiSubApp = express();

let options = {fallthrough: false, name: 'Sneakers Api Sub-App', port: 4020};

startExpressApplicationServer(sneakersApiSubApp, options, true);
//adds the router to to subApp not the main app
sneakersApiSubApp.addRouter(router);


module.exports =
    (() => {
        return () => sneakersApiSubApp;
    })();

    
