'use strict';
const axios = require('axios');
const colors = require('colors');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const devConstants = require('../../../development/dev-constants');
const express = require('express');
const { throwError } = require('../../../validation/validation');
const { waitFor } = require('../../utils/app-utils');

//environment variables
const MAX_REGISTRATION_RETRIES = process.env.MAX_REGISTRATION_RETRIES || devConstants.MAX_REGISTRATION_RETRIES;
const POLL_INTERVAL = process.env.POLL_INTERVAL || devConstants.POLL_INTERVAL;
const TIMEOUT = process.env.TIMEOUT || devConstants.TIMEOUT;
const TRY_DURATION = process.env.TRY_DURATION || devConstants.TRY_DURATION;
let registryServerUrl = '';

const { debug, error, info, warn, getModuleLoggingMetaData } = require('../../../../logging/logger/global-logger')(module);

/**
 * A promise for the user's favorite color.
 *
 * @promise EndpointArrayPromise
 * @fulfill {Array.<String>} The user's favorite color.
 * @reject {TypeError} The user's favorite color is an invalid type.
 * @reject {MissingColorError} The user has not specified a favorite color.
 */

/**
 * Retrieve the user's favorite color.
 *
 * @returns {FavoriteColorPromise} A promise for the user's favorite color.
 */


/**
  * This function authenicates the Express app with the authentication server.
  * 
  * @author Troy Lovell Jones
  * @param {String} authUrl - The URI for the authenication service.
  * @param {{name: String, serverId: number, password: String, traceId: number}} authInfo Authentication infornmation for the server.
  * @returns {Promise<Array<String>} The list of endpoints/middleware registered on the app.
  * 
  */
async function authenticateServer(authUrl, authInfo) {
  const { name, serverId, password, traceId } = authInfo;

  try {
    !name && throwError('Missing server name!');
    !serverId && throwError('Missing server id!');
    !password && throwError('Missing password!');
    !traceId && warn('No trace id provided.');
    debug('Authentication information = ');
    debug(`Contacting Authentication Server at ${authUrl}`.magenta);
    const response = await axios.post(authUrl, authInfo);
    !response && throwError('No response from server!');
    return response;
  } catch (e) {
      error(`${JSON.stringify(e, null, 2)}`);
      e.stack && error(`${JSON.stringify(e.stack, null, 2)}`);
      e && e.response && error(`HTTP Response Code: ${e.response.status}`);
      error(`Function authenticate() failed.  Could not authenticate ${name}!`.red);
      error(`Because server authetication failed, process terminating in 3 seconds...`);
      //Give the logger time to log messages before exiting the application
      await waitFor(3000);
      process.exit();
  }
};

const getRegistryServerUrl = () => {
  return registryServerUrl;
};

/**
  * This function gets the installed middleware for a Express app.
  * 
  * @author Troy Lovell Jones
  * @param {Object} app - The Express app.
  * @returns {Array.<String>} The list of endpoints/middleware registered on the app.
  */
const getRoutingInformation = (app) => {
  debug('-Registered routes...'.white);
  const routes = [];
  app._router.stack.forEach(function (middleware) {
    let route;
    debug('Middleware'.grey.bold.underline);
    debug(JSON.stringify(middleware, null, 2));
    if (middleware.route) {
      // routes registered directly on the app
      routes.push(middleware.route);
    } else if (middleware.name === 'router') {
      // router middleware
      middleware.handle.stack.forEach(function (handler) {
        route = handler.route;
        route && routes.push(route);
      });
    }
  });
  const routePathsArr = [];
  routes.forEach((route) => {
    debug(`Route path: `.white + `${route.path}`.green);
    routePathsArr.push(route.path);
    route.stack.forEach((stack) => {
      debug(`-Route function: `.white + `${stack.name}`.brightBlue);
      debug(`-Route method: `.white + `${stack.method}`.magenta);
    });
  });

  debug('-End of registered routes'.white);
  return routePathsArr;
};

/**
  * This function installs commonly used middleware.
  * 
  * @author Troy Lovell Jones
  * @param {Object} app - The Express app
  * @returns {undefined}
  */
const installDefaultMiddleware = (app) => {
  app.use(express.json());
  app.use(cors());
  app.use(cookieParser());
};

/**
  * This function registers application termination behavior.
  * 
  * @author Troy Lovell Jones
  * @param {Object} server - The Express app
  * @param {String} ipAddress - The ip address of the server
  * @param {String} registrationServerUrl - The URI where the registration service can be reached.
  * @param {Object} token This is the JWT token required to access the registration service
  * @returns {undefined} 
  */
function onAppTermination(server, ipAddress, registrationServerUrl, token) {
  const saveServerInstance = (server) => {
    return () => {
      return server;
    };
  };
  const serverInstance = saveServerInstance({ server, ipAddress, token });

  process.on('SIGTERM', () => {
    //all methods place here and below must be synchronous
    debug('SIGTERM signal received: closing HTTP server');
    const { server, ipAddress, token } = serverInstance();
    setServerStatus(ipAddress, 'Unavailable', registrationServerUrl, token).then(() => {
      server.close(() => {
        //any shutdown procedures will go here
        //but server will not accept any more requests
        log('HTTP server closed');
      });
      waitFor(2000).then(() => process.exit());
    });
  });
}

/**
  * This function registers an application with the registry service.
  * 
  * @author Troy Lovell Jones
  * @param {String} registationUrl - The URI where the registration service can be reached.
  * @param {Object} regInfo - This is the information that must be supplied to the registration service.
  * @param {Object} token - This is the JWT token required to access the registration service.
  * @param {Number} tries = This is the number of registration attempts.
  * @returns {Object} - The response from the HTTP call to the registration service.
  */
async function register(registrationUrl, regInfo, token, tries) {
  debug('<----------Calling register() on the client machine---------->'.gray);
  const body = { ...regInfo, status: 'Avaiable' };
  try {
    debug(`Registering server at ${registrationUrl}`.magenta);
    registryServerUrl = registrationUrl.replace('/register', '');
    const header = setAuthHeader(token);
    const response = await axios.post(`${registrationUrl}`, body, header);
    return response;
  } catch (e) {
      const processErrors = tries >= MAX_REGISTRATION_RETRIES;
      error(JSON.stringify(e, null, 2));
      //supress exceptions until the retry count has been cxceeded
      processErrors && error('register() error.  Could not post data to registration server!');
      if (processErrors) throw e;
  }
}

let tries;

/**
  * This function will attempt to register an application with the registry service until the maximum number of retries has been attampted.
  * 
  * @author Troy Lovell Jones
  * @param {String} registationUrl - The URI where the registration service can be reached.
  * @param {Object} regInfo - This is the information that must be supplied to the registration service.
  * @param {Object} token - This is the JWT token required to access the registration service.
  * 
  */
async function registerServer(registrationUrl, regInfo, token) {
  tries = 1;
  debug('<----------Start of registerServer() on the client machine---------->'.gray);
  debug(`Register app ${regInfo.name}`.cyan);
  debug('Registering with token: ');
  debug(JSON.stringify(token, null, 2));
  debug('Registration Info: ');
  debug(JSON.stringify(regInfo, null, 2));
  debug(`Server will attempt to register ${MAX_REGISTRATION_RETRIES} time(s).`);
  try {

    while (tries < MAX_REGISTRATION_RETRIES) {
      //pause before calling the register function again
      await waitFor(TRY_DURATION);
      debug(`Register Attempt #: ${tries++}`.blue);
      const response = await register(registrationUrl, regInfo, token, tries);
      debug(`Response recieved. = ${response && JSON.stringify(response.data, null, 2) || 'no response'}`);
      if (response) {
        debug('<----------End of registerServer() on the client machine---------->'.gray);
        return response;
      }
      
    }    
  } catch (e) {
      error('Throwing exception');
      error('Registration Failed!:');
      throw e;
  }
  finally {
    tries = 1;
  }
}

/**
  * @todo - implement generic retry functionality.
  * 
  * @author Troy Lovell Jone
  * 
  */
async function retry(func, ...params) {
  tries = 0;
  try {
    while (tries < MAX_RETRIES) {
      debug(`Attempt #: ${++tries}`);
      const response = await func(...params);
      debug(`Response recieved. = ${response && JSON.stringify(response.data, null, 2) || 'no response'}`);
      if (response) {
        return response;
      }
      await waitFor(RETRY_DURATION);
    }
  } catch (e) {
    error('Throwing exception');
    error(`Call to ${func.name} failed`);
    error(`Will make ${MAX_RETRIES} more attempt(s)`);
   
  }
  finally {
    tries = 0;
  }    

}

/**
  * This function will set the authorization of an HTTP request.
  * 
  * @author Troy Lovell Jones
  * @param {Object} token - This is the JWT token required to access the service.
  * 
  */
const setAuthHeader = (token) => {
  debug('Setting authorization header.');
  return {
    headers: {
      Authorization: 'Bearer ' + token.jwt //the token is a variable which holds the token.
    }
  };
};

/**
  * This function will set the authorization of an HTTP request.
  * 
  * @author Troy Lovell Jones
  * @private
  * @param {String} serverId - Unique identifier for the application.
  * @param {String} status = The status of the application.
  * @param {String} registerationServerUrl - The URI where the registration service can be reached.
  * @param {Object} token - This is the JWT token required to access the registration service.
  * @returns {String} - Returns a string with the authorization information.
  */
async function setServerStatus(serverId, status, registrationServerUrl, token) {
  const body = {};
  debug('Updating registration info');
  const url = registrationServerUrl + '/update/server';
  body.id = serverId;
  body.status = status;

  try {
    const header = setAuthHeader(token);
    const result = await axios.put(url, body, header);
    debug('Registration info succesfully updated.'.green);
    return result;
  } catch (e) {
    error(e);
    error(e.stack);
    error('There was a problem updating server registration.'.red);
  }
}
/**
  * @todo - This needs to be rewritten
  * 
  * This function starts the Express Application.
  * @author Troy Lovell Jones
  * @param {Object} app The Express app.
  * @param {String} name The name of the application.
  * @param {number} port The port on which the application listens for requests.
  * @return {Object} Returns an object containing an http server and boolean indicating
  *   whether or not the server started successfully
  */
const startApp = async (app, name, port) => {
  const onLogIn = ((name, port) => {
    return () => {
      //once callback is called, we know the app has started
      app.started = true;
      debug(
        `-Application server ${name} started on port ` + `${port}`.brightGreen
      );
      debug(
        `Application server started at ` +
          `${new Date()}.`.cyan +
          `Ready to receive API requests.`.brightGreen
      );
    };
  })(name, port);
  const httpServer = app.listen(port, onLogIn);
  //wait for the app to actually start
  const start = new Date().getSeconds();
  while (true) {
    const duration = new Date().getSeconds() - start;
    if (app.started) {
      debug('Server started!');
      return {
        httpServer,
        started: true
      }; //once the app starts return from the function
    }
    if (duration >= TIMEOUT) {
      debug('Request to start server timed out!');
      return { started: false }; //once maxmum timeout is reached return from function
    } else {
      debug('Waiting for server to start...');
      await waitFor(POLL_INTERVAL); //wait for the app to start
    }
    debug('Waiting...waiting...waiting');
  }
};

const updateRegistryServerUrl = (update) => {
  registryServerUrl = update.url;
};

module.exports = {
  authenticateServer,
  getModuleLoggingMetaData,
  getRegistryServerUrl,
  getRoutingInformation,
  installDefaultMiddleware,
  onAppTermination,
  registerServer,
  setAuthHeader,
  startApp,
};
