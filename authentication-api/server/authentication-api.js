"use strict";

const express = require('express');
const { resolve } = require('path');

const app = express();
const appServices = require('../../core/server/app/services/app-services');
const configFile = require('../../config/config-file').getConfigFile(resolve(__dirname, '.cfg'));
const devConstants = require('../../core/development/dev-constants');
const getConnection = require('../../core/server/repository/databases/mongodb/mongo-database');
const hostIpAddress = require('../../core/server/utils/host-ip');
const validation = require('../../core/validation/validation');

//middleware, routers
const { authorizationMiddlewareList } = require('../../core/server/middleware/authorization/authorize-routes');
const generateTraceId = require('../../core/server/middleware/logging/generate-trace-info');
const { requestCount } = require('../../core/server/middleware/requestCounter');
const protectedRouter = require('./routes/protected-router');
const unProtectedRouter = require('./routes/unprotected-router');

//environment variables
const env = require('dotenv').config();
const AUTHENTICATE_URL = (process.env.AUTH_URL || devConstants.AUTH_URL) + (process.env.AUTH_SERVER_URL || devConstants.AUTH_SERVER_URL);
const NODE_ENV = process.env.NODE_ENV || 'production';
const PORT = process.env.PORT || 4200;
const PROTOCOL = devConstants.PROTOCOL;
const REGISTRATION_SERVER_URL = process.env.REGISTRATION_URL || devConstants.REGISTRATION_SERVER_URL;
const REGISTER_SERVER_URL = process.env.REGISTER_SERVER_URL || devConstants.REGISTER_SERVER_URL;
const REGISTRATION_URL = REGISTRATION_SERVER_URL + REGISTER_SERVER_URL;
const SERVER_ID = process.env.SERVER_ID || '633a67dce78e495ce6088db';
const SERVER_NAME = process.env.SERVER_NAME || 'auth-api-svr';

//logging
const { error, getModuleLoggingMetaData, info } = require('../../logging/logger/global-logger')(module);
const { startTrace, stopTrace } = require('../../logging/logger/tracer');
const { updateModuleLoggingMetaData } = require('../../logging/logger/logger-manager');

const { throwError } = require('../../core/validation/validation');

const { getModuleDependencies, waitFor } = require('../../core/server/utils/app-utils');
const dependencies = Array.from(getModuleDependencies(module));
module.getModuleLoggingMetaData = getModuleLoggingMetaData;
module.getDependencies = () => dependencies;
env.error && validation.throwError(env.error);

info(`Running node in ${NODE_ENV} mode.`);
info(`IP address = ${hostIpAddress}`);

const authenticate = async (password, traceId) => {
  const authInfo = { 
    name: SERVER_NAME, 
    serverId: SERVER_ID, 
    password, 
    traceId 
  };

  const { data: response } = await appServices.authenticateServer(
    PROTOCOL.concat('://')
    .concat(hostIpAddress)
    .concat(':')
    .concat(PORT)
    .concat(AUTHENTICATE_URL),
    authInfo
  );
  !response && throwError('No response from server!');
  info(`${SERVER_NAME} authenticated.`.green.bold);
  const { tokens, newPassword } = response;
  info('Session tokens = ');
  console.log(tokens);
  info(tokens);
  NODE_ENV !== 'production' && info(`New password = ${newPassword.password}`);
  return response;
}

const configureMiddleware = async () => {
  protectedRouter && info('Protected routes retrieved.'.green) || throwError('Routes were not retrieved!');
  unProtectedRouter && info('Unprotected routes retrieved.'.green) || throwError('Routes were not retrieved!');
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
    info('Registration Response:');
    info(`SERVER NAME: ${SERVER_NAME}, SERVER ID: ${SERVER_ID}, PORT ${PORT}, SUCCESSFULLY REGISTERED.`);
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
    configureMiddleware();
    const traceId = startTrace(module);
    //start the app so that it can authenticate itself
    const { httpServer, started } = await appServices.startApp(app, SERVER_NAME, PORT);
    !started && throwError('Authentication server could not be started');
    const password = await configFile.getValueFromConfigFile('PASSWORD');
    !password && throwError('Server configuration file is missing or invalid!');
    await getConnection();
     // <---------------AUTHENTICATION--------------->
     const { newPassword, tokens } = await authenticate(password, traceId);
    newPassword && info(`Saving new password.`) && await configFile.saveValueToConfigFile('PASSWORD', password);
    // <---------------REGISTRATION----------------->
    await register(tokens.accessToken, traceId);
    appServices.onAppTermination(httpServer, hostIpAddress, REGISTRATION_SERVER_URL, tokens.accessToken);
    updateModuleLoggingMetaData(module, { phase: 'ready' });
    stopTrace(module, traceId);
    // <------------SERVER START UP DONE------------->
  } catch (e) {
      e && error(e);
      e.stack && error(e.stack);
      error('<----------Error condition triggered, error caught, server will not reattempt, shutting down---------->');
      error('Could not start authentication-app-server');
      //Give the logger time to log any buffered error messages before exiting
      await waitFor(2000);
      process.exit();
  }
})();

module.exports = { getModuleLoggingMetaData }
