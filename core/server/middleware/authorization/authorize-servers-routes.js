'use strict';

const { authenticateTokenAsync } = require('../../../../core/server/secrets/services/token');
const colors = require('colors');
const { getSecrets } = require('../../secrets/model/secrets');
const env = require('dotenv').config();
const { log, error, getModuleLoggingMetaData } = require('../../../../logging/logger/global-logger')(module);
const { updateModuleLoggingMetaData } = require('../../../../logging/logger/logger-manager');
const { getModuleDependencies } = require('../../utils/app-utils');
const dependencies = Array.from(getModuleDependencies(module));
module.getDependencies = () => dependencies;
module.getModuleLoggingMetaData = getModuleLoggingMetaData;

//middleware to protect the routes
//for now the middleware function is almost identical the the user authorization
//middleware.  They may diverge in the future and having separte middleware functions
//makes this easier from the start
const authorizeServerRoutes = (req, res, next) => {
  const clientIp = req.ip.includes('::ffff:') ? req.ip.split('::ffff:')[1] : req.ip;
  const { serverId } = req.body;
  const traceId = req.traceId;
  updateModuleLoggingMetaData(module, {traceId, clientIp});
  if (!serverId) {
    error('Server id missing.');
    return res.status(401).send('HTTP 401 Unauthorized.');
  }
  log(`Client ip address = ${clientIp}`);
  log('<----------start of authorizeServerRoute()---------->'.magenta);
  const skip = skipRequest(req.url);
  log(`Authorizing route ${req.url}.`.magenta);
  if (skip) {
    return next();
  };
  //look for token in one of three places
  // 1. authorization header
  // 2. query string
  // 3. cookie
  const authHeader = extractHeaderInformation(req);
  const token = (authHeader && authHeader.split(' ')[1]) || (req && (req.query.token || req.cookies.Token || req.cookies.token));
  log(`Validating token = ${token}, serverId = ${serverId}`);
  if (token === null) {
    log(`Request of '${req.url}' denied!`.red, `:${clientIp}`);
    return res.status(401).send('HTTP 401 Unauthorized.');
  }
  getSecrets()
    .then(secrets => {
      secrets.locateSecretsById(serverId)
        .then(secrets => {
          const { accessTokenSecret } = secrets;
          log('Waiting for token authentication.');
          authenticateTokenAsync(token, accessTokenSecret)
            .then(result => {
              log(`Authentication result = ${JSON.stringify(result)}`);
              //add the token to an httpOnly cookie and the authorization header
              !res.get('Authorization') &&
              res.set('Authorization', `Bearer = ${token}`);
              res.cookie('token', token);
              res.cookie('httpOnly', true);
              res.cookie('secure', true);
              res.token = token;
              log('<------------Token Authorized------------>\n'.green);
              log('<----------End of authorizeSeverRoutes---------->'.magenta);
              return next(); 
            }).catch(err => {
                error(err);
                return res.status(500).send('HTTP 500 Internal Error');
            })
        }).catch(err => {
            error(err);
            return res.status(500).send('HTTP 500 Internal Error');
        })
    }) 
    .catch(err => {
      error(err);
      return res.status(500).send('HTTP 500 Internal Error');
    });  
  
};

const extractHeaderInformation = (req) => {
  const authHeader = (req.headers && req.headers['Authorization']) || req.headers['authorization'];
  log('HTTP Authorization Header = ', { authHeader });
  return authHeader;
};

const skipRequest = (url) => {
  log('Checking if a server route has been requested by the client');
  if (!url.includes('server') && !url.includes('token')) {
    log('Not a server route, skipping...');
    return true
  }
  log(`Requested route: ${url}`.blue);
  log('Authorize route for client');
  //make sure it's not admin router, if it is, skip user authorization
  if (url.includes('/admin')) {
    log('Admin route, skipping...');
    return true;
  }
  return false;
};

module.exports = { authorizeServerRoutes,  getModuleLoggingMetaData };
