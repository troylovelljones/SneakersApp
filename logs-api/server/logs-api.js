"use strict";

const { getConfigFile } = require('../../config/config-file');
const { getModuleDependencies } = require('../../core/server/utils/app-utils');
const { log, error, getModuleLoggingMetaData } = require('../../logging/logger/global-logger')(module);
const { resolve } = require('path');
const { throwError } = require('../../core/validation/validation');

const appServices = require('../../core/server/app/services/app-services');
const configFile = getConfigFile(resolve(__dirname, '.cfg'));
const devConstants = require('../../core/development/dev-constants');
const env = require('dotenv').config();
const express = require('express');
const getConnection = require('../../core/server/repository/databases/mongodb/mongo-database');
const hostIpAddress = require('../../core/server/utils/host-ip');
const unprotectedRouter = require('./routes/router');

//environment variables
const AUTHENTICATE_SERVER_URL = process.env.AUTH_URL;
const NODE_ENV = process.env.NODE_ENV || 'production';
const PORT = process.env.PORT || 80;
const SERVER_NAME = process.env.SERVER_NAME || 'logs-api-svr';
const SERVER_ID = process.env.SERVER_ID;

//logging
module.getModuleLoggingMetaData = getModuleLoggingMetaData;
const dependencies = Array.from(getModuleDependencies(module));
log(dependencies);
module.getDependencies = () => dependencies;

env.error && throwError(env.error);

(async () => {
  try {
    const { startTrace, stopTrace } = require('../../logging/logger/tracer');
    log('Environment Variables');
    log(JSON.stringify(env, null, 2));
    const app = express();
    appServices.installDefaultMiddleware(app);
    app.use(unprotectedRouter); //routes that can be reached without token validation
    const traceId = startTrace(module);
    appServices.getRoutingInformation(app, true);
    const PASSWORD = await configFile.getValueFromConfigFile('PASSWORD');
    !PASSWORD && throwError('Server configuration file is missing or invalid!');
    log(`Password: ${PASSWORD}`);
    const db = log('Connecting to Mongo DB...') && await getConnection();
    db && log(`Connected to Sneakers DB.`);
    const authInfo = {
      name: SERVER_NAME, 
      serverId: SERVER_ID,
      password: PASSWORD,
      traceId
    };
    let response = await appServices.authenticateServer(AUTHENTICATE_SERVER_URL, authInfo); 
    !response && error('Authentication error!') && throwError('Unable to authenticate server!');
    log('Server authenticated.');
    const { registrationUrl, tokens, newPassword } = response.data;
    const { httpServer, started } = await appServices.startApp(app, SERVER_NAME, 80);
    const password = newPassword && newPassword.password;
    log('Access tokens = ');
    log(tokens);
    password && log('New password from the server.');
    NODE_ENV !== 'production' && password && log('Password = ');
    NODE_ENV !== 'production' && password && log(password);
    password && log(`Saving new password.`) && await config.saveValueToConfigFile('PASSWORD', password);
    !started && throwError('Logging server could not be started');
    const blank = '';
    const regInfo = {
      name: SERVER_NAME,
      ipAddress: hostIpAddress + (NODE_ENV !== 'production' && devConstants.randomIpTuple()) || blank,
      serverId: SERVER_ID || ipAddress,
      port: PORT,
      endPoints: appServices.getRoutingInformation(app),
      traceId
    };
    log('JWT access tokens = ');
    log(tokens);
    !tokens && throwError('Invalid token!');
    const { accessToken } = tokens;
    appServices.onAppTermination(
      httpServer,
      hostIpAddress,
      registrationUrl,
      tokens
    );
    log(`Attempting to communicate with registration server at ${registrationUrl}`);
    result = await appServices.registerServer(
      registrationUrl,
      regInfo,
      accessToken
    );
    log('Answer recieved from registry server...');
    log(result.data);
    result.status && result.status === 200 && log(`${SERVER_NAME} registered.`.toLocaleUpperCase().green.bold) ||throwError(result);
    stopTrace(module, traceId);
    log(`${SERVER_NAME.toUpperCase()} SUCCESSFULLY AUTHENTICATED AND REGISTERED!`.green);
  
  } catch (e) {
    e && error(JSON.stringify(e));
    e.stack && error(JSON.stringify(e.stack));
    error('Could not start authentication-app-server, ending process');
    process.exit();
    
    
  }
})();
