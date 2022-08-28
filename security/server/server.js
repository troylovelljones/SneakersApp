
const {startExpressApplicationServer, addRouter, hostStaticFiles} = require('../../core/server/basic-express-server/expressAppServer');
const {mountSubApp, getMainPort} = require('../../core/server/main-server');
const router = require("./routes/router");
const colors = require("colors");
const path = require('path');
const express = require('express');

const securitySubApp = express();


const SECURITY_LINK = '/security';
const LOGIN_LINK = '/login';
const CSS_LINK = '/css'
const JS_LINK = '/js'
const VALIDATOR_LINK = '/validation';
const IMAGES_LINK = '/images';

let options = {fallthrough: false, name: 'Security Sub-App'};

startExpressApplicationServer(securitySubApp, options);

securitySubApp.hostStaticFiles(path.resolve(__dirname,'../../core/data-validation/'), VALIDATOR_LINK, options);
securitySubApp.hostStaticFiles(path.resolve(__dirname,'../client/login/css/'), CSS_LINK, options);
securitySubApp.hostStaticFiles(path.resolve(__dirname,'../client/login/js'), JS_LINK, options);
securitySubApp.hostStaticFiles(path.resolve(__dirname,'../client/login/images'), IMAGES_LINK, options);

options.index = "login.html";
securitySubApp.hostStaticFiles(path.resolve(__dirname,'../client/login/html'), LOGIN_LINK, options);

//adds the router to to subApp not the main app
securitySubApp.addRouter(router);

options = {port: 4015, name: 'Security Sub-App'};

mountSubApp(securitySubApp, SECURITY_LINK);



