
const {startServer} = require('../../../core/server/base-sneakers-app-server/base-server');
const colors = require("colors");
const path = require('path');
const express = require('express');
const securityApp = express();
const envVars = require('dotenv').config();

//environment variables
const PORT = process.env.PORT || 4000;
const SNEAKERS_LOGIN_APP =  process.env.SNEAKERS_LOGIN_APP || 'Security Login App'
const SERVER_IP_ADDRESS =  process.env.SERVER_IP_ADDRESS || 'http://locahost';
const SNEAKERS_API_APP = process.env.SNEAKERS_API_API_APP || 'Sneakers Api App';
//static content links
const LOGIN_LINK = '/login';
const CSS_LINK = '/css'
const JS_LINK = '/js'
const VALIDATOR_LINK = '/data-validation';
const IMAGES_LINK = '/images';


const options = {fallthrough: false, 
    name: SNEAKERS_LOGIN_APP, 
    ipAddress: SERVER_IP_ADDRESS,
    port: PORT,
    registrationServerUrl: 'http://localhost:4500/sneakers/app-registration-server/register',
    enableMwLogging: true,
    enableMwTracing: true
};

startServer(securityApp, options);

securityApp.hostStaticFiles(path.resolve(__dirname,'../../core/data-validation/'), VALIDATOR_LINK, options);
securityApp.hostStaticFiles(path.resolve(__dirname,'../client/login/css/'), CSS_LINK, options);
securityApp.hostStaticFiles(path.resolve(__dirname,'../client/login/js'), JS_LINK, options);
securityApp.hostStaticFiles(path.resolve(__dirname,'../client/login/images'), IMAGES_LINK, options);

options.index = "login.html";
securityApp.hostStaticFiles(path.resolve(__dirname,'../client/login/html'), LOGIN_LINK, options);




