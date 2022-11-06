'use strict';

//core node modules
const colors = require('colors');
const path = require('path');
const cors = require('cors');
const { resolve } = require('path');
const configFile = require('../../../config/config-file').getConfigFile(resolve(__dirname, '.cfg')
);
const express = require('express');
const app = express();
const {
  hostStaticFiles
} = require('../../../core/server/middleware/general-middleware');
const appServices = require('../../../core/server/app/services/app-services');
const router = require('../../../core/server/routes/generic/public/public-routes');
const protectedRouter = require('../../../core/server/routes/generic/protected/protected-router');
const devConstants = require('../../../core/development/dev-constants');

//environment variables
const envVars = require('dotenv').config();
const PORT = process.env.PORT || 4000;
const SERVER_NAME = process.env.SERVER_NAME || 'admin-app-server';
const HOST_IP_ADDRESS = require('../../../core/server/utils/host-ip');
const NODE_ENV = process.env.NODE_ENV;
//cannot dynamically determine the location of the registration server
const REGISTRATION_SERVER_URL = process.env.REGISTRATION_SERVER_URL|| devConstants.REGISTRATION_SERVER_URL;
const REGISTER_SERVER_URL = process.env.REGISTER_SERVER_URL || devConstants.REGISTER_SERVER_URL;
const SERVER_REGISTRATION_URL = REGISTRATION_SERVER_URL  + REGISTER_SERVER_URL;
const AUTHENTICATE_SERVER_URL = devConstants.AUTH_URL + devConstants.AUTH_SERVER_URL;
const SERVER_ID = process.env.SERVER_ID || HOST_IP_ADDRESS;

const { throwError } = require('../../../core/validation/validation');
!SERVER_ID && throwError('No server id configured!');

//cannot dynamically determine the location of the registration server
const locateServer = require('../../../core/locate/locate-server')(REGISTRATION_SERVER_URL);

//static content links
const ADMIN_LINK = '/admin';
const CSS_LINK = '/css';
const JS_LINK = '/js';
const VALIDATOR_LINK = '/validation';
const IMAGES_LINK = '/images';

const { error, log, getModuleLoggingMetaData } = require('../../../logging/logger/global-logger')(module);
const { startTrace, stopTrace } = require('../../../logging/logger/tracer');
const { getModuleDependencies } = require('../../../core/server/utils/app-utils');
const dependencies = Array.from(getModuleDependencies(module));
module.getModuleLoggingMetaData = getModuleLoggingMetaData;
module.getDependencies = () => dependencies;
const options = { fallthrough: false };
envVars.error && console.log(envVars) && throwError(envVars.error);

const configureStaticHosting = (app, options) => {
  //make html, css and javascript files available at http://server-ip/login
  hostStaticFiles(
    app,
    path.resolve(__dirname, '../../../core/validation'),
    VALIDATOR_LINK,
    options
  );
  hostStaticFiles(
    app,
    path.resolve(__dirname, '../../client/css/'),
    CSS_LINK,
    options
  );
  hostStaticFiles(
    app,
    path.resolve(__dirname, '../../client/js'),
    JS_LINK,
    options
  );
  hostStaticFiles(
    app,
    path.resolve(__dirname, '../../client/images'),
    IMAGES_LINK,
    options
  );
  //set the default html page
  options.index = 'admin-page.html';
  hostStaticFiles(
    app,
    path.resolve(__dirname, '../../client/html'),
    ADMIN_LINK,
    options
  );
};


//synchronous setup of the app
app.use(express.json());
app.use(cors());
app.use(router);
configureStaticHosting(app, options);
//do not move the line below above this line, all middleware added after this line will be inaccessable without an access token
app.use(protectedRouter);
const info = {
  name: SERVER_NAME,
  ipAddress: HOST_IP_ADDRESS + (NODE_ENV !== 'production' && devConstants.randomIpTuple()) || '',
  port: PORT,
  endPoints: appServices.getRoutingInformation(app),
  id: SERVER_ID,
  status: 'Available'
};

//add the endpoint for the admin application
info.endPoints.push('/admin');

(async () => {
    try {
      //authenticate server
      const traceId = startTrace(module);
      info.traceId = traceId;
      log(`Starting trace with trace id = ${traceId}.`);
      const PASSWORD = await configFile.getValueFromConfigFile('PASSWORD');
      !PASSWORD && throwError('Server configuration file is missing or invalid!');
      log(`Password: ${PASSWORD}`);
      let response = await appServices.authenticateServer(
        SERVER_NAME,
        HOST_IP_ADDRESS,
        PASSWORD,
        AUTHENTICATE_SERVER_URL,
        { traceId }
      );
      info.traceId = traceId;
      const token = response.data;
      log(`Token = ${JSON.stringify(token, null, 2)}`);
      //register server so it can be discovered remotely
      response = await appServices.registerServer(SERVER_REGISTRATION_URL, info, token);
      const { password } = response;
      response.password && await config.saveValueToConfigFile('PASSWORD', password) && log('Saving the new server password.');
      log('Server Registered.  Determine sneakers-app location.');
      const sneakersServerInfo = await locateServer('', token);
      log(
        `sneakers-app found info = ${JSON.stringify(
          sneakersServerInfo,
          null,
          2
        )}.`
      );
      const { ipAddress, port } = sneakersServerInfo;
      const SNEAKS_APP_URL = `${ipAddress}:${port}/`;
      log(`Sneakers URL = ${SNEAKS_APP_URL}`);
      router.setAppUrls(
        SNEAKS_APP_URL,
        AUTHENTICATE_USER_URL,
        REGISTRATION_USER_URL
      );
      const httpServer = await appServices.startApp(app, SERVER_NAME, PORT);
      appServices.onAppTermination(httpServer, HOST_IP_ADDRESS, REGISTRATION_SERVER_URL, token);
      log(`Stoppping trace with trace id = ${traceId}.`);
      stopTrace(module, traceId);
    } catch (e) {
      error(e.stack);
      error('There was an error loading the user-login-server.');
      throw e;
    }
  })();
  
  module.exports = { getModuleLoggingMetaData }
