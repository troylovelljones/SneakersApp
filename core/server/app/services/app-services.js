'use strict';
const axios = require('axios');
const colors = require('colors');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const devConstants = require('../../../development/dev-constants');
const express = require('express');
const { throwError } = require('../../../validation/validation');
const { waitFor } = require('../../utils/app-utils');
const { synchLoggerMetaData } = require('../../../../logging/logger/logger');

//environment variables
const MAX_REGISTRATION_RETRIES = process.env.MAX_REGISTRATION_RETRIES || devConstants.MAX_REGISTRATION_RETRIES;
const POLL_INTERVAL = process.env.POLL_INTERVAL || devConstants.POLL_INTERVAL;
const RETRY_DURATION = process.env.RETRY_DURATION || devConstants.RETRY_DURATION;
const TIMEOUT = process.env.TIMEOUT || devConstants.TIMEOUT;
let registryServerUrl = '';

const authenticationUrl = process.env.AUTH || devConstants.AUTH_URL;
const AUTH_TOKEN_URL = process.env.AUTH_TOKEN_URL || devConstants.AUTH_TOKEN_URL;
const { log, error, warn, getModuleLoggingMetaData } = require('../../../../logging/logger/global-logger')(module);

const authenticateServer = async (authUrl, authInfo) => {
  const { name, serverId, password, traceId } = authInfo;
  try {
    !name && throwError('Missing server name!');
    !serverId && throwError('Missing server id!');
    !password && throwError('Missing password!');
    !traceId && warn('No trace id provided.');
    log('Authentication information = ');
    log(`Contacting Authentication Server at ${authUrl}`.magenta);
    return await axios.post(`${authUrl}`, authInfo);
  } catch (e) {
      error(JSON.stringify(e, null, 2));
      e.stack && error(JSON.stringify(e.stack, null, 2));
      error(`HTTP Response Code: ${e && e.response && e.response.status}`);
      error(`authenticate() error.  Could not authenticate ${name}!`.red);
      return process.exit();
  }
};

const getRegistryServerUrl = () => {
  return registryServerUrl;
};

const getRoutingInformation = (app) => {
  log('-Registered routes...'.white);
  const routes = [];
  app._router.stack.forEach(function (middleware) {
    let route;
    log('Middleware'.grey.bold.underline);
    log(JSON.stringify(middleware, null, 2));
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
    log(`Route path: `.white + `${route.path}`.green);
    routePathsArr.push(route.path);
    route.stack.forEach((stack) => {
      log(`-Route function: `.white + `${stack.name}`.brightBlue);
      log(`-Route method: `.white + `${stack.method}`.magenta);
    });
  });

  log('-End of registered routes'.white);
  return routePathsArr;
};

const installDefaultMiddleware = (app) => {
  app.use(express.json());
  app.use(cors());
  app.use(cookieParser());
};

//this function takes an httpServer as an argument not an express app
//an httpServer is returned from the app.listen() method
function onAppTermination(server, ipAddress, registrationServerUrl, token) {
  const saveServerInstance = (server) => {
    return () => {
      return server;
    };
  };
  const serverInstance = saveServerInstance({ server, ipAddress, token });

  process.on('SIGTERM', () => {
    //all methods place here and below must be synchronous
    log('SIGTERM signal received: closing HTTP server');
    const { server, ipAddress, token } = serverInstance();
    setServerStatus(
      ipAddress,
      'Unavailable',
      registrationServerUrl,
      token
    ).then((result) => {
      server.close(() => {
        //any shutdown procedures will go here
        //but server will not accept any more requests
        log('HTTP server closed');
      });
      process.exit();
    });
  });
}

//registration
async function register(registrationUrl, regInfo, token, tries) {
  log('<----------Start of register() on the client machine---------->'.gray);
  const body = { ...regInfo, status: 'Avaiable' };
  try {
    log(`Registering server at ${registrationUrl}`.magenta);
    registryServerUrl = registrationUrl.replace('/register', '');
    const header = setAuthHeader(token);
    const response = await axios.post(`${registrationUrl}`, body, header);
    return response;
  } catch (e) {
      const processErrors = tries >= MAX_REGISTRATION_RETRIES;
      error(JSON.stringify(e, null, 2));
      processErrors && error('register() error.  Could not post data to registration server!');
      if (processErrors) throw e;
  }
}

let tries = 1;

async function registerServer(registrationUrl, regInfo, token) {
  log('<----------Start of registerServer() on the client machine---------->'.gray);
  log(`Register app ${regInfo.name}`.blue);
  log('Registering with token: ');
  log(JSON.stringify(token, null, 2));
  log('Registration Info: ');
  log(JSON.stringify(regInfo, null, 2));
  log(`Server will attempt to register ${MAX_REGISTRATION_RETRIES} time(s).`);
  try {
    while (tries < MAX_REGISTRATION_RETRIES) {
      log(`Attempt #: ${tries++}`);
      const response = await register(registrationUrl, regInfo, token, tries);
      log(`Response recieved. = ${response && JSON.stringify(response.data, null, 2) || 'no response'}`);
      if (response) {
        log('<----------End of registerServer() on the client machine---------->'.gray);
        return response;
      }
      await waitFor(RETRY_DURATION);
    }    
  } catch (e) {
      error('Throwing exception');
      error('Registration Failed!:');
      throw e;
  }
}

const setAuthHeader = (token) => {
  log('Setting authorization header.');
  return {
    headers: {
      Authorization: 'Bearer ' + token.jwt //the token is a variable which holds the token
    }
  };
};

async function setServerStatus(serverId, status, registrationServerUrl, token) {
  const body = {};
  log('Updating registration info');
  const url = registrationServerUrl + '/update/server';
  body.id = serverId;
  body.status = status;

  try {
    const header = setAuthHeader(token);
    const result = await axios.put(url, body, header);
    log('Registration info succesfully updated.'.green);
    return result;
  } catch (e) {
    error(e);
    error(e.stack);
    error('There was a problem updating server registration.'.red);
  }
}

//need to rewrite this method to make better use of promises
const startApp = async (app, name, port) => {
  const onLogIn = ((name, port) => {
    return () => {
      //once callback is called, we know the app has started
      app.started = true;
      log(
        `-Application server ${name} started on port ` + `${port}`.brightGreen
      );
      log(
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
      log('Server started!');
      return {
        httpServer,
        started: true
      }; //once the app starts return from the function
    }
    if (duration >= TIMEOUT) {
      log('Request to start server timed out!');
      return { started: false }; //once maxmum timeout is reached return from function
    } else {
      log('Waiting for server to start...');
      await waitFor(POLL_INTERVAL); //wait for the app to start
    }
    log('Waiting...waiting...waiting');
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
