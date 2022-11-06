'use strict';

const axios = require('axios');
const cors = require('cors');
const colors = require('colors');
const env = require('dotenv').config();
const express = require('express');
const app = express();
const { resolve } = require('path');
const appServices = require('../../core/server/app/services/app-services');
const configFile = require('../../config/config-file').getConfigFile(resolve(__dirname, '.cfg'));
const devConstants = require('../../core/development/dev-constants');
const { getModuleDependencies } = require('../../core/server/utils/app-utils');
const getRouter = require('./routes/unprotected-routes/router');
const getProtectedRouter = require('./routes/protected-routes/router');
const { throwError } = require('../../core/validation/validation');

//logging setup
const { log, error, getModuleLoggingMetaData } = require('../../logging/logger/global-logger')(module);
const { startTrace, stopTrace } = require('../../logging/logger/tracer');
//environment variables
const NODE_ENV = process.env.NODE_ENV || 'production';
const AUTHENTICATE_URL = process.env.AUTH_URL || devConstants.AUTH_URL + (process.env.AUTH_SERVER_URL || devConstants.AUTH_SERVER_URL);
const HOST_IP_ADDRESS = require('../../core/server/utils/host-ip') + (NODE_ENV === 'development' && log('Generated a random ip addres for testing.') && devConstants.randomIpTuple() || '');
const PORT = process.env.PORT || 4500;
const REGISTRATION_SERVER_URL = process.env.REGISTRATION_SERVER_URL || devConstants.REGISTRATION_SERVER_URL;
const REGISTER_SERVER_URL = process.env.REGISTER_SERVER_URL || devConstants.REGISTER_SERVER_URL;
const REGISTRATION_URL = REGISTRATION_SERVER_URL + REGISTER_SERVER_URL;
const SERVER_ID = process.env.SERVER_ID || HOST_IP_ADDRESS;
const SERVER_NAME = process.env.APP_NAME || 'registration-api-server';

const { authorizationMiddlewareList } = require('../../core/server/middleware/authorization/authorize-routes');
const generateTraceId = require('../../core/server/middleware/logging/generate-trace-info');
const dependencies = Array.from(getModuleDependencies(module));
const { requestCount, getRequestCount } = require('../../core/server/middleware/requestCounter');
module.getModuleLoggingMetaData = getModuleLoggingMetaData;
module.getDependencies = () => dependencies;
log(`Running node in ${NODE_ENV} mode.`);
log(`Environment variables ${JSON.stringify(env, null, 2)}`);
log('Launching server.');
log(`IP address = ${HOST_IP_ADDRESS}`);

const authenticate = async (password, traceId) => {
  const authInfo = {
    name: SERVER_NAME,
    password,
    serverId: SERVER_ID,
    traceId
  }
  const result = await appServices.authenticateServer(AUTHENTICATE_URL, authInfo);
  const secrets = result.data;
  const { token } = secrets;
  log('Access token = ');
  log(token);
  return secrets;
};

const configureMiddleware = async () => {
  const protectedRouter = await getProtectedRouter();
  (protectedRouter && log('Protected routes retrieved.'.green)) ||
    throwError('Routes were not retrieved!');
  const unProtectedRouter = await getRouter();
  (protectedRouter && log('Unprotected routes retrieved.'.green)) ||
  throwError('Routes were not retrieved!');
  appServices.installDefaultMiddleware(app);
  app.use(requestCount);
  app.use(generateTraceId);
  app.use(unProtectedRouter); //unprotected Routes
  app.use(authorizationMiddlewareList);
  app.use(protectedRouter); //protected Routes
} 

const processResponseData = (data, regType) => {
  !data && throwError(`${regType} unsuccessful!`);
  log(`${regType} successful.`.green);
};

//self registration
const register = async (token, traceId) => {
  try {
    const serverInfo = {
      name: SERVER_NAME,
      ipAddress: HOST_IP_ADDRESS,
      port: PORT,
      endPoints: appServices.getRoutingInformation(app),
      serverId: SERVER_ID,
      traceId
    };
    log('Sending server information to registry service.');
    log(serverInfo);
    const response = await appServices.registerServer(
      REGISTRATION_URL,
      serverInfo,
      token
    );
    log('Registration Response:');
    log(response);
    processResponseData(response.data, 'Registration');
    const { id } = response.data;
    app.id = id;
    return response.data;
  } catch (e) {
      error('We got an error in register().');
      error(e);
      e.stack && error(e.stack);
      throwError('Register error.');
  }
};

//taking server offline, set satus to unavailable
const unregister = async (registrationUrl, id) => {
  const body = {};
  body.id = id;
  body.status = 'Unavailable';
  try {
    log(`Unregistering server at ${registrationUrl}`.magenta);
    return await axios.put(`${registrationUrl}`, body);
  } catch (e) {
    e.stack && error(e.stack);
    error('unregister() error.  Could not update data to registration server!');
    return false;
  }
};

(async () => {

    try {
        await configureMiddleware();
        const traceId = startTrace(module);
        const password = await configFile.getValueFromConfigFile('PASSWORD');
        !password && throwError('Server configuration file is missing or invalid!');
        // <---------------AUTHENTICATION--------------->
        const { secret: newPassword, tokens } = await authenticate(password, traceId);
        log('Authentication successful!');
        newPassword ? await configFile.saveValueToConfigFile('PASSWORD', newPassword.password) && log('A new pasword was saved to config file') : log('Server password was not changed.'); 
        const httpServer = await appServices.startApp(app, SERVER_NAME, PORT);
        appServices.onAppTermination(httpServer, HOST_IP_ADDRESS, REGISTRATION_URL, tokens.accessToken);
        log(`Tokens =  ${JSON.stringify(tokens)}`);
        // <---------------REGISTRATION----------------->
        await register(tokens.accessToken, traceId);
        log(`SERVER NAME: ${SERVER_NAME}, SERVER ID: ${SERVER_ID}, PORT ${PORT}, SUCCESSFULLY REGISTERED.`)
        stopTrace(module, traceId);
      // <------------SERVER START UP DONE------------->
    } catch (e) {
      console.log(e);
      error(e.stack);
      error('Error starting server!  Check the configuration and .env files for errors!'); 
      process.exit();
        
    }})();
