
const {startExpressApplicationServer} = require('./basic-express-server/expressAppServer');
const colors = require("colors");
const output = require('dotenv').config();
const path = require('path');
const router = require('./router/router');
const express = require('express');
const vhost = require('vhost');
const mainApp = express();



console.log((output && output.error && output.error.message.red) || `\nDOT-ENV (.env) file loaded.`.green);
if (output) {
    console.log(`Using the following configuration parameters...`)
    for (const vars in output.parsed)
        console.log(`${vars}`.blue +  ` = `.white + `${output.parsed[vars]}`.yellow);
} else throw new Error('No environment varables found!'.red);

const getMainPort = () => process.env.SERVER_PORT;

startExpressApplicationServer(mainApp,
    {name: 'Main-Server', port: process.env.SERVER_PORT, fallthrough: false}, true);

//mainApp.addRouter(router);

mainApp.mountSubApp = (subApp, url, usingVhost) => {
    const error = !(mainApp && 
        subApp && 
        url && 
        (subApp !== mainApp));
    console.log(`Main app: ${mainApp.appName}, Sub-app: ${subApp.appName}.`);
    if (error) throw new Error('Cannot mount sub-app!  Bad paramenters.  '.
        red.concat(!url && 'Url is null!'.yellow || '')); 
    console.log(`Mounting sub-application at url ${url}`.green);
    mainApp.use(url, subApp);
    
    
}

const securityApp = require('../../security/server/security-app-server');
securityApp.appName = 'Security Sub-App';
const securityApi = require('../../security/server/security-api-server');
securityApi.appName = 'Security Api Sub-App';
const sneakersApp = require('../../sneakers/server/sneakers_app_server');
sneakersApp.appName = 'Sneakers Sub-App';
const sneakersApi = require('../../sneakers/server/sneakers_api_server');
sneakersApi.appName = 'Sneakers Api Sub-App';
mainApp.mountSubApp(securityApp,'/app-server');
//mainApp.mountSubApp(securityApi, '/api-server/security');
//mainApp.mountSubApp(sneakersApp, '/app-server/sneakers');
//mainApp.mountSubApp(sneakersApi,'/api-server/sneakers');


  

console.log(`Main app value: ${mainApp}`.blue);

module.exports = {getMainPort};

