
const {startExpressApplicationServer, addRouter, hostStaticFiles} = require('./express-server/expressAppServer');
const router = require("./routes/router");
const colors = require("colors");
const output = require('dotenv').config();
const path = require('path')

const STATIC_FILE_LOCATION = 'login';
console.log((output && output.error && output.error.message.red) || `\nDOT-ENV (.env) file loaded.`.green);
if (output) {
    console.log(`Using the following configuration parameters...`)
    for (const vars in output.parsed)
        console.log(`${vars}`.blue +  ` = `.white + `${output.parsed[vars]}`.yellow);
}

const directories = [];
directories.push(path.resolve(__dirname,'../client/login'));
directories.push(path.resolve(__dirname,'../../core/data-validation'));
hostStaticFiles(directories);

addRouter(router);



startExpressApplicationServer({port: process.env.SERVER_PORT});

