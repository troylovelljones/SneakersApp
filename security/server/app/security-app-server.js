//core node modules
const colors = require("colors");
const path = require('path');
const cors = require('cors');
const express = require('express');
const app = express();
const cookieParser = require('cookie-parser');

//environment variables
const envVars = require('dotenv').config();
const PORT = process.env.PORT || 4000;
const SERVER_NAME =  process.env.SERVER_NAME || 'Sneakers Login App'
const IP_ADDRESS =  process.env.IP_ADDRESS || 'http://locahost';
const REGISTRATION_SERVER_URL = process.env.REGISTRATION_SERVER_URL || 'http://localhost:4500/sneakers/app-registration-server';
//static content links
const LOGIN_LINK = '/login';
const CSS_LINK = '/css'
const JS_LINK = '/js'
const VALIDATOR_LINK = '/data-validation';
const IMAGES_LINK = '/images';
const REGISTER_LINK = '/register';

//fake id address goes away when app is deployed to cloud
const fakeIpAddress = '192.168.255.253';
const options = {fallthrough: true, 
    name: SERVER_NAME, 
    ipAddress: fakeIpAddress,
    port: PORT,
    registrationServerUrl: REGISTRATION_SERVER_URL + REGISTER_LINK
};


const {registerServer, throwError, 
    loginSuccess, hostStaticFiles, getRegistrationServerUrl} = require('../../../core/server/base-sneakers-app-server/base-server');
envVars.error && !log(envVars) && throwError(envVars.error);

const basicRouter = require('../../../core/server/base-sneakers-app-server/routes/base-router');
//install middleware
app.use(express.json());
app.use(cors());
app.use(basicRouter);
app.listen(PORT, loginSuccess(SERVER_NAME, PORT));
//register server so it can be discovered remotely
registerServer(app, options);
app.use(cookieParser());
app.use(setCookie);
//make html, css and javascript files available at http://server-ip/login
hostStaticFiles(app, path.resolve(__dirname,'../../../core/data-validation/'), VALIDATOR_LINK, options);
hostStaticFiles(app, path.resolve(__dirname,'../../client/login/css/'), CSS_LINK, options);
hostStaticFiles(app, path.resolve(__dirname,'../../client/login/js'), JS_LINK, options);
hostStaticFiles(app, path.resolve(__dirname,'../../client/login/images'), IMAGES_LINK, options);
//set the default html page
options.index = "login.html";
hostStaticFiles(app, path.resolve(__dirname,'../../client/login/html'), LOGIN_LINK, options);

//cookie middleware
function setCookie(req, res, next) {
    // check if client sent cookie
    const cookie = req.cookies.cookieName;
    if (cookie === undefined) {
      //set a new cookie && 
      //remove the /register endpoint
      console.log(`Registration Server Location: ${getRegistrationServerUrl()}`);
      res.cookie('registryUrl', getRegistrationServerUrl());
      console.log('cookie created successfully');
    } else {
      // yes, cookie was already present 
      console.log('cookie exists', cookie);
    } 
    next(); // <-- important!
};




