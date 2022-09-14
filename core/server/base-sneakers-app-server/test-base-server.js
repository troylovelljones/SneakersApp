const {initializeServer} = require('./base-server');
const express = require('express');
const app = express();

const PORT = 4500;
const fakeIpAddress = 'http://localhost';
const registrationServerUrl = fakeIpAddress + ':' + PORT + '/sneakers/app-registration-server/register';

const options = {fallthrough: true,     
    name: 'Test App', 
    port: 4800,
    ipAddress: '192.168.255.255',
    registerServer: true,
    enableMwLogging: true,
    enableMwTracing: true,
    registrationServerUrl
};

initializeServer(app, options);
app.start();

