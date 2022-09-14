"use strict";

//node modules
const express = require('express');
const colors = require("colors");
const cors = require('cors');
const { Console } = console;


//environment variables
const envVars = require('dotenv').config();
const PORT = process.env.PORT || 4200;
const SERVER_NAME = process.env.SERVER_NAME || 'Sneakers Api Server'
const IP_ADDRESS =  process.env.IP_ADDRESS || 'http://locahost';
const REGISTRATION_RETRIES = process.env.REGISTRATION_RETRIES || 4;
const REGISTRATION_SERVER = process.env.REGISTRATION_SERVER || 'http://localhost:4500/sneakers/app-registration-server/register';
const RETRY_TIMEOUT_MS = 2000;

//utility functions for managing an express server
const {registerServer, throwError, loginSuccess} = require('../../../core/server/base-sneakers-app-server/base-server');

const appConsole = new Console({colorMode: true, groupIndentation: 3,
    stdout: process.stdout, 
    stderr: process.stderr});

//this goes away once software is deployed in a cloud environment
const fakeIpAddress = '192.168.255.252';
//server configuration
const options = {fallthrough: true, 
    name: SERVER_NAME, 
    ipAddress: fakeIpAddress, 
    port: PORT,
    registrationServerUrl: REGISTRATION_SERVER
};

//make sure we found a proper .env file
envVars.error && console.log(envVars) && throwError(envVars.error);

const app = express();
const basicRouter = require('../../../core/server/base-sneakers-app-server/routes/base-router');
const router = require('../routes/router');

//install middleware
app.use(express.json());
app.use(cors());
app.use(basicRouter);
app.use(router);

app.listen(PORT, loginSuccess(SERVER_NAME, PORT));
//register server so it can be discovered remotely
registerServer(app, options);

