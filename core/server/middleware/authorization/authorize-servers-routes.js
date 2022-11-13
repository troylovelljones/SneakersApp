'use strict';

const { authenticateTokenAsync } = require('../../../../core/server/secrets/services/token');
const colors = require('colors');
const { getSecrets } = require('../../secrets/model/secrets');
const env = require('dotenv').config();
const { debug, error, info, getModuleLoggingMetaData } = require('../../../../logging/logger/global-logger')(module);
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
  debug(req.body);
  const clientIp = req.ip.includes('::ffff:') ? req.ip.split('::ffff:')[1] : req.ip;
  const { serverId } = req.body;
  const traceId = req.traceId;
  traceId && updateModuleLoggingMetaData(module, {traceId, clientIp});
  debug(`Client ip address = ${clientIp}`);
  debug('<----------start of authorizeServerRoute()---------->'.magenta);
  const skip = skipRequest(req.url);
  debug(`Authorizing route ${req}.`.magenta);
  if (skip) {
    return next();
  };
  if (!serverId) {
    error('Server id missing.');
    error('Rejecting request with error code HTTP 401.');
    return res.status(401).send('HTTP 401 Unauthorized.');
  }
  //look for token in one of three places
  // 1. authorization header
  // 2. query string
  // 3. cookie
  const authHeader = extractHeaderInformation(req);
  const token = (authHeader && authHeader.split(' ')[1]) || (req && (req.query.token || req.cookies.Token || req.cookies.token));
  debug(`Validating token = ${token}, serverId = ${serverId}`);
  if (token === null) {
    debug(`Request of '${req.url}' denied!`.red, `:${clientIp}`);
    return res.status(401).send('HTTP 401 Unauthorized.');
  }
  getSecrets()
    .then(secrets => {
      secrets.locateSecretsById(serverId)
        .then(secrets => {
          const { accessTokenSecret } = secrets;
          debug('Waiting for token authentication.');
          authenticateTokenAsync(token, accessTokenSecret)
            .then(result => {
              debug(`Authentication result = ${JSON.stringify(result)}`);
              //add the token to an httpOnly cookie and the authorization header
              !res.get('Authorization') &&
              res.set('Authorization', `Bearer = ${token}`);
              res.cookie('token', token);
              res.cookie('httpOnly', true);
              res.cookie('secure', true);
              res.token = token;
              debug('<------------Token Authorized------------>\n'.green);
              debug('<----------End of authorizeSeverRoutes---------->'.magenta);
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
  debug('HTTP Authorization Header = ', { authHeader });
  return authHeader;
};

const skipRoutes = ['server', 'token', 'logs'];

const skipRequest = (url) => {
  debug('Checking if s route has been requested by the client that requires server authorization');
  skipRoutes.forEach(route => {
    if (url.includes(route)) {
      debug('Not a route that requires server authorization, skipping...');
      return true
    }
  })
  if (!url.includes('server') && !url.includes('token')) {
    debug('Not a route that requires server authorization, skipping...');
    return true
  }
  debug(`Requested route: ${url}`.blue);
  debug('Authorize route for client');
  //make sure it's not admin router, if it is, skip user authorization
  if (url.includes('/admin')) {
    debug('Admin route, skipping...');
    return true;
  }
  return false;
};

module.exports = { authorizeServerRoutes,  getModuleLoggingMetaData };
