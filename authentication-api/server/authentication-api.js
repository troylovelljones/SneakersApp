"use strict";
const appServices = require('../../core/server/app/services/app-services');
const env = require('dotenv').config();
const devConstants = require('../../core/development/dev-constants');
const express = require('express');
const generateTraceId = require('../../core/server/middleware/logging/generate-trace-info');
const getConnection = require('../../core/server/repository/databases/mongodb/mongo-database');
const { resolve } = require('path');

//environment variables
const AUTHENTICATE_URL = (process.env.AUTH_URL || devConstants.AUTH_URL) + (process.env.AUTH_SERVER_URL || devConstants.AUTH_SERVER_URL);
const HOST_IP_ADDRESS = require('../../core/server/utils/host-ip');
const NODE_ENV = process.env.NODE_ENV || 'production';
const PORT = process.env.PORT || 4200;
const PROTOCOL = devConstants.PROTOCOL;
const REGISTRATION_SERVER_URL = process.env.REGISTRATION_URL || devConstants.REGISTRATION_SERVER_URL;
const REGISTER_SERVER_URL = process.env.REGISTER_SERVER_URL || devConstants.REGISTER_SERVER_URL;
const REGISTRATION_URL = REGISTRATION_SERVER_URL + REGISTER_SERVER_URL;
const SERVER_NAME = process.env.SERVER_NAME || 'auth-api-svr';
const SERVER_ID = process.env.SERVER_ID || '633a67dce78e495ce6088db';
const CONFIG_FILE = process.env.CONFIG_FILE || resolve(__dirname, '.cfg');

const { authorizationMiddlewareList } = require('../../core/server/middleware/authorization/authorize-routes');

const { getConfigFile } = require('../../config/config-file');
const { getModuleDependencies } = require('../../core/server/utils/app-utils');
const config = getConfigFile(CONFIG_FILE);
const validation = require('../../core/validation/validation');
const unprotectedRouter = require('./routes/unprotected-router');
const protectedRouter = require('./routes/protected-router');
const { log, error, getModuleLoggingMetaData } = require('../../logging/logger/global-logger')(module);
const { updateModuleLoggingMetaData } = require('../../logging/logger/logger-manager');
const dependencies = Array.from(getModuleDependencies(module));
const { throwError } = require('../../core/validation/validation');
const { startTrace, stopTrace } = require('../../logging/logger/tracer');
const { requestCount, getRequestCount } = require('../../core/server/middleware/requestCounter');

module.getModuleLoggingMetaData = getModuleLoggingMetaData;
module.getDependencies = () => dependencies;
env.error && validation.throwError(env.error);

(async () => {
  try {
    log('Environment Variables');
    log(JSON.stringify(env, null, 2));
    const app = express();
    appServices.installDefaultMiddleware(app);
    app.use(requestCount);
    app.use(generateTraceId); //genrate a traceid for every request
    app.use(unprotectedRouter); //routes that can be reached without token validation
    app.use(authorizationMiddlewareList); //validate tokens for protected routes
    app.use(protectedRouter); //routes that can't be reached without token validation
    const { httpServer, started } = await appServices.startApp(
      app,
      SERVER_NAME,
      PORT
    );
    !started && throwError('Authentication server could not be started');
    const traceId = startTrace(module);
    let password = await config.getValueFromConfigFile('PASSWORD');
    if (NODE_ENV !== 'production') {
      log('Password = ');
      log(password);
    }
    const db = getConnection();
    const authInfo = { name: SERVER_NAME, serverId: SERVER_ID, password, traceId };
    let response = (
      await appServices.authenticateServer(
        PROTOCOL.concat('://')
          .concat(HOST_IP_ADDRESS)
          .concat(':')
          .concat(PORT)
          .concat(AUTHENTICATE_URL),
        authInfo
      )
    ).data;
    log(`${SERVER_NAME} authenticated.`.green.bold);
    updateModuleLoggingMetaData(module, { phase:'ready' });
    log('Logging meta-data', );
    password = response ? response.newPassword && response.newPassword.password : null;
    password && log('New password from the server.');
    NODE_ENV !== 'production' && log('Password = ');
    NODE_ENV !== 'production' && log(password);
    password && log(`Saving new password.`) && await config.saveValueToConfigFile('PASSWORD', password);
    log(`JWT tokens = ${JSON.stringify(response.tokens, null, 2)}`);
    const blank = '';
    const serverInfo = {
      name: SERVER_NAME,
      ipAddress: HOST_IP_ADDRESS +  (NODE_ENV !== 'production' && devConstants.randomIpTuple()) || blank,
      serverId: SERVER_ID,
      port: PORT,
      endPoints: appServices.getRoutingInformation(app),
      traceId
    };
    const { tokens } = response;
    log(tokens);
    !tokens && throwError('Invalid token!');
    const { accessToken } = tokens;
    appServices.onAppTermination(
      httpServer,
      HOST_IP_ADDRESS,
      REGISTRATION_SERVER_URL,
      tokens
    );
    log(`Attempting to communicate with registration server at ${REGISTRATION_SERVER_URL}`);
    response = await appServices.registerServer(REGISTRATION_URL, serverInfo, accessToken);
    log('Answer recieved from registry server...');
    log(response.data);
    (response.status && response.status === 200 && log(`${SERVER_NAME} registered.`.toLocaleUpperCase().green.bold)) || throwError(response);
    stopTrace(module, traceId);
  } catch (e) {
      error(JSON.stringify(e, null, 2));
      error(JSON.stringify(e.stack));
      error('<----------Error condition triggered, error caught, server will not reattempt, shutting down---------->'.gray);
      throwError('Could not start authentication-app-server');
  }
})();

module.exports = { getModuleLoggingMetaData }
