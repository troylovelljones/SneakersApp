const router = require("../routes/api-router");
const express = require('express');
const colors = require("colors");
const PORT = process.env.PORT || 4100;
const SNEAKERS_API_APP = 'Security Api Server';
const SERVER_IP_ADDRESS =  process.env.SERVER_IP_ADDRESS || 'http://locahost';
require('dotenv').config();
const {startServer} = require('../../../core/server/base-sneakers-app-server/base-server');
const securityApiApp = express();

const options = {fallthrough: false, 
    name: SNEAKERS_API_APP, 
    ipAddress: SERVER_IP_ADDRESS,
    port: PORT,
    enableMwLogging: true,
    enableMwTracing: true
};

const registrationServerUrl = 'http://localhost:4500/sneakers/app-registration-server/register';

startServer(securityApiApp, options);
securityApiApp.addARouter(router);
securityApiApp.registerApplication()











