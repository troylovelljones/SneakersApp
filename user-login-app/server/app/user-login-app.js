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
const router = require('../routes/router');
const protectedRouter = require('../routes/router');
const devConstants = require('../../../core/development/dev-constants');

//environment variables
const envVars = require('dotenv').config();
const PORT = process.env.PORT || 4000;
const SERVER_NAME = process.env.SERVER_NAME || 'user-login-server';
const HOST_IP_ADDRESS = require('../../../core/server/utils/host-ip');
const NODE_ENV = process.env.NODE_ENV;
//cannot dynamically determine the location of the authentication server
const AUTH_URL = process.env.AUTH_URL || devConstants.AUTH_URL;
const AUTHENTICATE_USER_URL = (process.env.AUTH_URL || devConstants.AUTH_URL) + (process.env.AUTH_USER_URL || devConstants.AUTH_USER_URL);
const AUTHENTICATE_SERVER_URL = AUTH_URL +  devConstants.AUTH_SERVER_URL;
const SERVER_ID = process.env.SERVER_ID;
const REGISTRATION_SERVER_URL = process.env.REGISTRATION_SERVER_URL|| devConstants.REGISTRATION_SERVER_URL;
const REGISTER_USER_URL = process.env.REGISTER_USER_URL || devConstants.REGISTER_USER_URL;
const REGISTER_SERVER_URL = process.env.REGISTER_SERVER_URL || devConstants.REGISTER_SERVER_URL;
const SERVER_REGISTRATION_URL = REGISTRATION_SERVER_URL + REGISTER_SERVER_URL;
const USER_REGISTRATION_URL = REGISTRATION_SERVER_URL + REGISTER_USER_URL;
const SNEAKERS_ADMIN_SERVER = process.env.SNEAKERS_ADMIN_SERVER || 'admin-app-server';


const locateServer = require('../../../core/locate/locate-server')(REGISTRATION_SERVER_URL);
const throwError = require('../../../core/validation/validation');
//static content links
const LOGIN_LINK = '/login';
const CSS_LINK = '/css';
const JS_LINK = '/js';
const VALIDATOR_LINK = '/validation';
const IMAGES_LINK = '/images';
const ADMIN_LINK = '/admin';

const { error, log, getModuleLoggingMetaData } = require('../../../logging/logger/global-logger')(module);
const { startTrace, stopTrace } = require('../../../logging/logger/tracer');
const { getModuleDependencies } = require('../../../core/server/utils/app-utils');
const dependencies = Array.from(getModuleDependencies(module));
module.getModuleLoggingMetaData = getModuleLoggingMetaData;
module.getDependencies = () => dependencies;
const options = { fallthrough: false };
envVars.error && error(envVars) && throwError(envVars.error);

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
    path.resolve(__dirname, '../../client/login/css/'),
    CSS_LINK,
    options
  );
  hostStaticFiles(
    app,                                                                                                                \\\\\\\\ssssssssssssssssssqaqA['aaaaaaaaaaaaaaaaaaa']
    path.resolve(__dirname, '../../client/login/js'),
    JS_LINK,
    options
  );
  hostStaticFiles(
    app,
    path.resolve(__dirname, '../../client/login/images'),
    IMAGES_LINK,
    options
  );
  //set the default html page
  options.index = 'login.html';
  hostStaticFiles(
    app,
    path.resolve(__dirname, '../../client/login/html'),
    LOGIN_LINK,
    options
  );
};

//synchronous setup of the app
app.use(express.json());
app.use(cors());
app.use(router);
let info;
log('Configure static hosting');
try {
  configureStaticHosting(app, options);
  //do not move the line below above this line, all middleware added after this line will be inaccessable without an access token
  
  const endPoints = appServices.getRoutingInformation(app, false);
  log('Retrieved supported endpoints');

    app.use(protectedRouter);
    info = {
      name: SERVER_NAME,
      ipAddress: HOST_IP_ADDRESS + (NODE_ENV !== 'production' && devConstants.randomIpTuple()) || '',
      port: PORT,
      endPoints,
      id: SERVER_ID
    };
} catch (e) {
    error(JSON.stringify(e.stack));
    throw e;
}


(async () => {
  try {
    //authenticate server
    const traceId = startTrace(module);
    info.traceId = traceId;
    log(`Starting trace with trace id = ${traceId}.`);
    const PASSWORD = await configFile.getValueFromConfigFile('PASSWORD');
    !PASSWORD && throwError('Server configuration file is missing or invalid!');
    log(`Password: ${PASSWORD}`);
    log(`Registration URL`);
    log(AUTHENTICATE_SERVER_URL);
    let response = await appServices.authenticateServer(
      SERVER_NAME,
      HOST_IP_ADDRESS,
      PASSWORD,
      AUTHENTICATE_SERVER_URL,
      { traceId }
    );
    const token = response.data;
    log(`Token = ${JSON.stringify(token, null, 2)}`);
    //register server so it can be discovered remotely
    //remove
    log(SERVER_REGISTRATION_URL);
    response = await appServices.registerServer(SERVER_REGISTRATION_URL, info, token);
    const { password } = response;
    response.password && await config.saveValueToConfigFile('PASSWORD', password) && log('Saving the new server password.');
    log('Server Registered.  Determine sneakers-admin application location.');
    const adminServerInfo = await locateServer(SNEAKERS_ADMIN_SERVER, token);
    log(
      `sneakers-app found info = ${JSON.stringify(
        adminServerInfo,
        null,
        2
      )}.`
    );
    const { ipAddress, port } = adminServerInfo;
 
    const tempArray = ipAddress.split('.').length > 4 && ipAddress.split('.');
    tempArray.pop();
    const translatedIpAddress = tempArray.join('.');
    const SNEAKS_ADMIN_APP_URL = `${translatedIpAddress}:${port}${ADMIN_LINK}`;
    log(`Admin Server URL = ${SNEAKS_ADMIN_APP_URL}`);
    log(`Translated admin server ip address ${translatedIpAddress}`);
    log(`Admin link ${ADMIN_LINK}.`);
    router.setAppUrls(
      SNEAKS_ADMIN_APP_URL,
      AUTHENTICATE_USER_URL,
      USER_REGISTRATION_URL
    );
    const httpServer = await appServices.startApp(app, SERVER_NAME, PORT);
    appServices.onAppTermination(httpServer, HOST_IP_ADDRESS, REGISTRATION_SERVER_URL, token);
    log(`Stoppping trace with trace id = ${traceId}.`);
    stopTrace(module, traceId);
  } catch (e) {
    console.log(e.stack);
    error(e.stack);
    error('There was an error loading the user-login-server.');
    throw e;
  }
})();

module.exports = { getModuleLoggingMetaData };
