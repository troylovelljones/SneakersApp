'use strict';

const colors = require('colors');
const express = require('express');
const { resolve } = require('path');

const app = express();
const appServices = require('../../core/server/app/services/app-services');
const configFile = require('../../config/config-file').getConfigFile(resolve(__dirname, '.cfg'));
const devConstants = require('../../core/development/dev-constants');
const hostIpAddress = require('../../core/server/utils/host-ip');

//Routers/Middleware
const { authorizationMiddlewareList } = require('../../core/server/middleware/authorization/authorize-routes');
const getProtectedRouter = require('./routes/protected-routes/router');
const getRouter = require('./routes/unprotected-routes/router');
const generateTraceId = require('../../core/server/middleware/logging/generate-trace-info');
const { requestCount } = require('../../core/server/middleware/requestCounter');

//environment variables
const env = require('dotenv').config();
const NODE_ENV = process.env.NODE_ENV || 'production';
const AUTHENTICATE_URL = process.env.AUTH_URL || devConstants.AUTH_URL + (process.env.AUTH_SERVER_URL || devConstants.AUTH_SERVER_URL);
const PORT = process.env.PORT || 4500;
const REGISTRATION_SERVER_URL = process.env.REGISTRATION_SERVER_URL || devConstants.REGISTRATION_SERVER_URL;
const REGISTER_SERVER_URL = process.env.REGISTER_SERVER_URL || devConstants.REGISTER_SERVER_URL;
const REGISTRATION_URL = REGISTRATION_SERVER_URL + REGISTER_SERVER_URL;
const SERVER_ID = process.env.SERVER_ID || hostIpAddress;
const SERVER_NAME = process.env.APP_NAME || 'registration-api-server';

//logging
const { error, getModuleLoggingMetaData, info } = require('../../logging/logger/global-logger')(module);
const { startTrace, stopTrace } = require('../../logging/logger/tracer');
const { updateModuleLoggingMetaData } = require('../../logging/logger/logger-manager');

const { throwError } = require('../../core/validation/validation');

const { getModuleDependencies, waitFor } = require('../../core/server/utils/app-utils');
const dependencies = Array.from(getModuleDependencies(module));
module.getModuleLoggingMetaData = getModuleLoggingMetaData;
module.getDependencies = () => dependencies;

info(`Running node in ${NODE_ENV} mode.`);
info(`IP address = ${hostIpAddress}`);

const authenticate = async (password, traceId) => {
  const authInfo = {
    name: SERVER_NAME,
    password,
    serverId: SERVER_ID,
    traceId
  }
  const { data: response } = await appServices.authenticateServer(
    AUTHENTICATE_URL,
    authInfo
  );
  info(`${SERVER_NAME} authenticated.`.green.bold);
  const { tokens, newPassword } = response;
  info('Access token = ');
  info(`${JSON.stringify(tokens, null, 2)}`);
  NODE_ENV !== 'production' && info(`New password = ${newPassword.password}`);
  return response;
};

const configureMiddleware = async () => {
  const protectedRouter = await getProtectedRouter();
  (protectedRouter && info('Protected routes retrieved.'.green)) ||
    throwError('Routes were not retrieved!');
  const unProtectedRouter = await getRouter();
  (unProtectedRouter && info('Unprotected routes retrieved.'.green)) ||
  throwError('Routes were not retrieved!');
  appServices.installDefaultMiddleware(app);
  app.use(requestCount);
  app.use(generateTraceId);
  app.use(unProtectedRouter); //unprotected Routes
  app.use(authorizationMiddlewareList);
  app.use(protectedRouter); //protected Routes
} 

//self registration
const register = async (token, traceId) => {
  try {
    const serverInfo = {
      name: SERVER_NAME,
      ipAddress: hostIpAddress + (NODE_ENV === 'development' && 
        info('Generated a random ip addres for testing.') && 
        devConstants.randomIpTuple() || ''),
      port: PORT,
      endPoints: appServices.getRoutingInformation(app),
      serverId: SERVER_ID,
      traceId
    };
    info('Sending server information to registry service.');
    info(`${JSON.stringify(serverInfo, null, 2)}`);
    info(`Attempting to communicate with registration server at ${REGISTRATION_SERVER_URL}`);
    const response = await appServices.registerServer(
      REGISTRATION_URL,
      serverInfo,
      token
    );
    !response && throwError('No response from server!');
    info(`SERVER NAME: ${SERVER_NAME}, SERVER ID: ${SERVER_ID}, PORT ${PORT}, SUCCESSFULLY REGISTERED.`);
    info('Registration Response:');
    info(`${JSON.stringify(response.data, null, 2)}`);
    const { id } = response.data;
    id && info(`Saving server id.`) && await config.saveValueToConfigFile('SERVER_ID', id);
    app.id = id;
    return response.data;
  } catch (e) {
      error('We got an error in register().');
      throw e;
  }
};

(async () => {
    try {
      info('Environment Variables');
      info(`${JSON.stringify(env, null, 2)}`);
      await configureMiddleware();
      const traceId = startTrace(module);
      const password = await configFile.getValueFromConfigFile('PASSWORD');
      !password && throwError('Server configuration file is missing or invalid!');
      // <---------------AUTHENTICATION--------------->
      const { newPassword, tokens } = await authenticate(password, traceId);
      newPassword ? await configFile.saveValueToConfigFile('PASSWORD', newPassword.password) && info('A new pasword was saved to config file') : info('Server password was not changed.'); 
      const { httpServer, started } = await appServices.startApp(app, SERVER_NAME, PORT);
      !started && throwError('Authentication server could not be started');
      appServices.onAppTermination(httpServer, hostIpAddress, REGISTRATION_URL, tokens.accessToken);
      info(`Tokens =  ${JSON.stringify(tokens)}`);
      // <---------------REGISTRATION----------------->
      await register(tokens.accessToken, traceId);
      updateModuleLoggingMetaData(module, { phase:'ready' });
      stopTrace(module, traceId);
      // <------------SERVER START UP DONE------------->
    } catch (e) {
        error(`${JSON.stringify(e, null, 2)}`);
        error(`${JSON.stringify(e.stack, null, 2)}`);
        error('<----------Error condition triggered, error caught, server will not reattempt, shutting down---------->');
        error('Could not start registration-app-server');
        //Give the logger time to log the errors before shutting down the server
        await waitFor(2000);
        process.exit();
        
    }})();
    
    module.exports = { getModuleLoggingMetaData }