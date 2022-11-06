"use strict";

//node modules
const express = require('express');
const colors = require("colors");
const cors = require('cors');
const { Console } = console;
const devConstants = require('../../../core/development/dev-constants');


//environment variables
const envVars = require('dotenv').config();
const PORT = process.env.PORT || 4700;
const SERVER_NAME = process.env.SERVER_NAME || 'sneakers-api-server';
const IP_ADDRESS =  process.env.IP_ADDRESS || 'http://locahost';
const SECRET_KEY = process.env.SECRET_KEY;
const AUTHENTICATE_URL = (process.env.AUTH_URL || devConstants.AUTH_URL) + (process.env.AUTH_SERVER_URL || devConstants.AUTH_SERVER_URL);
const REGISTRATION_SERVER_URL = process.env.REGISTRATION_SERVER_URL || devConstants.REGISTRATION_SERVER_URL;
const REGISTER_SERVER_URL = process.env.REGISTER_SERVER_URL || devConstants.REGISTER_SERVER_URL;
const REGISTRATION_URL = REGISTRATION_SERVER_URL + REGISTER_SERVER_URL;


//utility functions for managing an express server
const { authenticateServer, getRoutingInformation, onAppTermination, registerServer, startApp, throwError, } = require('../../../core/server/app/base-app');

//make sure we found a proper .env file
envVars.error && console.log(envVars) && throwError(envVars.error);

const app = express();
const router = require('../../../core/server/routes/public-router');
const protectedRouter = require('../routes/private-api-router');

//install middleware
app.use(express.json());
app.use(cors());
app.use(router);
app.use(protectedRouter);

authenticateServer(SERVER_NAME, IP_ADDRESS, SECRET_KEY, AUTHENTICATE_URL).then((res) => {
    //register server so it can be discovered remotely
    console.log('Auth successful.  Token: ');
    const token = res.data;
    const info = { name: SERVER_NAME, ipAddress: IP_ADDRESS, port: PORT, endPoints: getRoutingInformation(app, false) };
    registerServer(REGISTRATION_URL, info, token);
    const httpServer = startApp(app, SERVER_NAME, PORT).then(() => {
        onAppTermination(httpServer, IP_ADDRESS, REGISTRATION_URL, token);
    });

});



