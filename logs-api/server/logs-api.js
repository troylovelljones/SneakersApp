"use strict";

/**
  * This function will send quality metrics to a remote logging server.
  * @author Troy Lovell Jones
  * This module is responsible for launching the logging server and haandling
  * data and saving it to the MongoDB remote datastore
  * 
  */

const express = require('express');

const { resolve } = require('path');
const { throwError } = require('../../core/validation/validation');

const app = express();
const appServices = require('../../core/server/app/services/app-services');
const configFile = require('../../config/config-file').getConfigFile(resolve(__dirname, '.cfg'));
const devConstants = require('../../core/development/dev-constants');
const getConnection = require('../../core/server/repository/databases/mongodb/mongo-database');
const hostIpAddress = require('../../core/server/utils/host-ip');

//middleware, routers
const { authorizationMiddlewareList } = require('../../core/server/middleware/authorization/authorize-routes');
const { requestCount } = require('../../core/server/middleware/requestCounter');
const unProtectedRouter = require('./routes/router');

//environment variables
const env = require('dotenv').config();
const AUTHENTICATE_URL = process.env.AUTH_URL;
const NODE_ENV = process.env.NODE_ENV || 'production';
const PORT = process.env.PORT || 4080;
const SERVER_NAME = process.env.SERVER_NAME || 'logs-api-svr';
const SERVER_ID = process.env.SERVER_ID;

const { getModuleDependencies, waitFor } = require('../../core/server/utils/app-utils');

//logging
const {debug, error, getModuleLoggingMetaData } = require('../../logging/logger/global-logger')(module);
const { startTrace, stopTrace } = require('../../logging/logger/tracer');
const {enableSendingQualityMetrics, updateModuleLoggingMetaData } = require('../../logging/logger/logger-manager');

module.getModuleLoggingMetaData = getModuleLoggingMetaData;
const dependencies = Array.from(getModuleDependencies(module));
debug(dependencies);
module.getDependencies = () => dependencies;

env.error && throwError(env.error);


/**
  * 
  * @author Troy Lovell Jones
  * This function will authenticate the logging server
  * @param {string} password
  * @param {number} traceId
  */
const authenticate = async (password, traceId) => {
  const authInfo = { 
    name: SERVER_NAME, 
    serverId: SERVER_ID, 
    password, 
    traceId 
  };
  const { data: response } = await appServices.authenticateServer(
    AUTHENTICATE_URL,
    authInfo
  );
  !response && throwError('No response from server!');
  info(`${SERVER_NAME} authenticated.`.green.bold);
  const { tokens, newPassword } = response;
  debug('Session tokens = ');
  debug(`${JSON.stringify(tokens, null, 2)}`);
  NODE_ENV !== 'production' && debug(`New password = ${newPassword.password}`);
  return response;
}

const configureMiddleware = async () => {
  unProtectedRouter && debug('Unprotected routes retrieved.') || throwError('Routes were not retrieved!');
  appServices.installDefaultMiddleware(app);
  app.use(requestCount);
  app.use(unProtectedRouter); //unprotected Routes
  app.use(authorizationMiddlewareList);

} 

/**
  * 
  * @author Troy Lovell Jones
  * This function will register the logging server with the registry service
  * @async
  * @param {string} registrationUrl the URI where the registration server can be reached
  * @param {Object} token
  * @property {string} accessToken
  * @property {string} jwt jwt access token for registration
  * @param {string} traceId id for distributed tracing, telemetry
  * @returns {Object} response object from registration server
  */
const register = async (registrationUrl, token, traceId) => {
  try {
    const serverInfo = {
      name: SERVER_NAME,
      ipAddress: hostIpAddress + (NODE_ENV === 'development' && 
        debug('Generated a random ip addres for testing.') && 
        devConstants.randomIpTuple() || ''),
      port: PORT,
      endPoints: appServices.getRoutingdebugrmation(app),
      serverId: SERVER_ID,
      traceId
    };
    debug('Sending server information to registry service.');
    debug(`${JSON.stringify(serverdebug, null, 2)}`);
    debug(`Attempting to communicate with registration server at ${registrationUrl}`);
    const response = await appServices.registerServer(
      registrationUrl,
      serverInfo,
      token
    );
    !response && throwError('No response from server!');
    debug('Registration Response:');
    debug(`SERVER NAME: ${SERVER_NAME}, SERVER ID: ${SERVER_ID}, PORT ${PORT}, SUCCESSFULLY REGISTERED.`);
    debug(`${JSON.stringify(response.data, null, 2)}`);
    const { id } = response.data;
    id && debug(`Saving server id.`) && await config.saveValueToConfigFile('SERVER_ID', id);
    app.id = id;
    return response.data;
  } catch (e) {
      error(e.stack);
      error('We got an error in register().');
      throw e;
  }
};


const startSendingLoggingMetrics = (accessToken) => {
  debug('Registering access token = ') && debug(accessToken);
  return enableSendingQualityMetrics(accessToken);
}

(async () => {
  try {
    debug('Environment Variables');
    debug(env);
    configureMiddleware();
    const traceId = startTrace(module);
    const password = await configFile.getValueFromConfigFile('PASSWORD');
    !password && throwError('Server configuration file is missing or invalid!');
    await getConnection();
    const db = debug('Connecting to Mongo DB...') && await getConnection();
     // <---------------AUTHENTICATION--------------->
    const { newPassword, registrationUrl, tokens } = await authenticate(password, traceId);
    !tokens.accessToken && error('Unable to obtain an access token!') && throwError();
    debug('Start sending logging metrics');
    newPassword && debug(`Saving new password.`) && await configFile.saveValueToConfigFile('PASSWORD', password);
    // <---------------REGISTRATION----------------->
    await register(registrationUrl, tokens.accessToken, traceId);
    updateModuleLoggingMetaData(module, { phase: 'ready' });
    //start the app so that it can receive logging debugrmation
    const { httpServer, started } = await appServices.startApp(app, SERVER_NAME, PORT);
    startSendingLoggingMetrics(tokens.accessToken);
    appServices.onAppTermination(httpServer, hostIpAddress, registrationUrl, tokens.accessToken);
    !started && throwError('Authentication server could not be started');
    stopTrace(module, traceId);
    // <------------SERVER START UP DONE------------->
  } catch (e) {
      e && error(e);
      error(e.stack);
      error('<----------Error condition triggered, error caught, server will not reattempt, shutting down---------->');
      error('Could not start authentication-app-server');
      //Give the logger time to log messages before exiting
      await waitFor(2000);
      process.exit();
  }

})();
