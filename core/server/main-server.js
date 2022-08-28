
const {startExpressApplicationServer, addRouter} = require('./basic-express-server/expressAppServer');
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
    {name: 'Main-Server', port: process.env.SERVER_PORT, fallthrough: false});

mainApp.addRouter(router);

mainApp.mountSubApp = (subApp, url, usingVhost) => {
    const error = !(mainApp && 
        subApp && 
        url && 
        (subApp !== mainApp));
    console.log(`Main app: ${mainApp.appName}, Sub-app: ${subApp.appName}.`);
    if (error) throw new Error('Cannot mount sub-app!  Bad paramenters.'.red); 
    console.log(`Mounting sub-application at url ${url}`.green);
    usingVhost ? mainApp.use(vhost(url, subApp)): mainApp.use(url, subApp);
    return {mountSubApp: mainApp.mountSubApp};
    
}


  

console.log(`Main app value: ${this.mainApp}`.blue);

module.exports = {mountSubApp: mainApp.mountSubApp, getMainPort};

