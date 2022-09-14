//core node modules
const colors = require("colors");
const path = require('path');
const cors = require('cors');
const express = require('express');
const app = express();
const cookieParser = require('cookie-parser');

//environment variables
const envVars = require('dotenv').config();
const PORT = process.env.PORT || 4300;
const SERVER_NAME =  process.env.SERVER_NAME || 'Sneakers App'
const IP_ADDRESS =  process.env.IP_ADDRESS || 'http://locahost';
const REGISTRATION_SERVER_URL = process.env.REGISTRATION_SERVER_URL || 'http://localhost:4500/sneakers/app-registration-server';
//static content links
const SNEAKERS_LINK = '/sneakers-client';
const CSS_LINK = '/css'
const JS_LINK = '/js'
const VALIDATOR_LINK = '/validation';
const IMAGES_LINK = '/images';
const ICONS_LINK = '/icons';

//fake id address goes away when app is deploye to cloud
const fakeIpAddress = '192.168.255.251';
const options = {fallthrough: false, 
    name: SERVER_NAME, 
    ipAddress: fakeIpAddress,
    port: PORT,
    registrationServerUrl: REGISTRATION_SERVER_URL
};

const {registerServer, throwError, 
    loginSuccess, hostStaticFiles} = require('../../../core/server/base-sneakers-app-server/base-server');
envVars.error && !console.log(envVars) && throwError(envVars.error);
console.log('Root directory ' + __dirname);
console.log(path.resolve(__dirname,'../../client/html'));

const basicRouter = require('../../../core/server/base-sneakers-app-server/routes/base-router');
//install middleware
app.use(express.json());
app.use(cors());
app.use(basicRouter);
app.use(cookieParser());
//need to install cookieParser
//middleware before we can do 
//anything with cookies
app.use(setCookie);
//set up static hosting for sneakers website
hostStaticFiles(app, path.resolve(__dirname,'../../../core/data-validation/'), VALIDATOR_LINK, options);
hostStaticFiles(app, path.resolve(__dirname,'../../client/css/'), CSS_LINK, options);
hostStaticFiles(app, path.resolve(__dirname,'../../client/js'), JS_LINK, options);
hostStaticFiles(app, path.resolve(__dirname,'../../client/images'), IMAGES_LINK, options);
hostStaticFiles(app, path.resolve(__dirname,'../../client/icons'), ICONS_LINK, options);
options.index = "sneakers-page.html";
hostStaticFiles(app, path.resolve(__dirname,'../../client/html'), '/', options);

app.listen(PORT, loginSuccess(SERVER_NAME));
//register server so it can be discovered remotely
registerServer(app, options);

// set a cookie
function setCookie(req, res, next) {
  // check if client sent cookie
  const cookie = req.cookies.cookieName;
  if (cookie === undefined) {
    //set a new cookie && 
    //remove the /register endpoint
    res.cookie('registryUrl', options.registrationServerUrl);
    console.log('cookie created successfully');
  } else {
    // yes, cookie was already present 
    console.log('cookie exists', cookie);
  } 
  next(); // <-- important!
};
