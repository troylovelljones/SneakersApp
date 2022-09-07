const {startExpressApplicationServer} = require('../../core/server/basic-express-server/expressAppServer');
const colors = require("colors");
const path = require('path');
const express = require('express');
const {register, locate} = require('../../core/server-connections/model/connection');

const sneakersApp = express();

const SNEAKERS_LINK = '/sneakers-client';
const CSS_LINK = '/css'
const JS_LINK = '/js'
const VALIDATOR_LINK = '/validation';
const IMAGES_LINK = '/images';
const SNEAKERS_APP = 'Sneakers Login App';

let options = {fallthrough: false, name: 'Sneaker App', port: 4050};

startExpressApplicationServer(sneakersApp, options, true);

console.log('Root directory ' + __dirname);



sneakersApp.hostStaticFiles(path.resolve(__dirname,'../../core/data-validation/'), VALIDATOR_LINK, options);
sneakersApp.hostStaticFiles(path.resolve(__dirname,'../client/css/'), CSS_LINK, options);
sneakersApp.hostStaticFiles(path.resolve(__dirname,'../client/js'), JS_LINK, options);
sneakersApp.hostStaticFiles(path.resolve(__dirname,'../client/images'), IMAGES_LINK, options);

options.index = "sneakers-page.html";
sneakersApp.hostStaticFiles(path.resolve(__dirname,'../client/html'), '/', options);




module.exports =
    (() => {
        return () => sneakersApiSubApp;
    })();