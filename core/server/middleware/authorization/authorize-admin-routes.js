'use strict';

const { authenticateTokenAsync } = require('../../secrets/services/token');
const colors = require('colors');
const { getUserId } = require('../../user/service/user');
//default logger
const {  debug, error, getModuleLoggingMetaData } = require('../../../../logging/logger/global-logger')(module);
const requiresAdminRole = (route) => {
  debug(`Checking this route: ${route}`);
  return route.includes('admin') && !route.includes('locate');
};

//middleware to protect the admin routes
const authorizeAdminRoutes = (req, res, next) => {
  const clientIp = req.ip.includes('::ffff:') ? req.ip.split('::ffff:')[1] : req.ip;
  getModuleLoggingMetaData().traceId = req.traceId;

  debug('Checking if an admin route has been requested by the client');
  if (!requiresAdminRole(req.url, clientIp)) {
    debug('Not an admin route request.'); //add the client ip to the log
    return next();
  }

  debug('Checking header for a valid access token.');
  const authHeader = req.headers['authorization'];
  const token =
    (authHeader && authHeader.split(' ')[1]) ||
    req.query.token ||
    req.cookies.token;
  debug(token && 'Token found.');
  //if the token is missing from the query string, the authorization header or the cookie,
  //deny access to the router
  if (token == null) return res.status(401).send('Unauthorized');

  //why did i implement this as a promise chain? need to refactor
  getSecrets()
    .then((Secrets) => {
      const id = req.query.id || req.body.id;
      //look for the token secret in the database
      const username = (req.query.usernanme || req.body.username);
      userId = username ? getUserId(username) : null;
      const secretsPromise = userId && Secrets.locateSecretsId(userId || id);
      
      secretsPromise
        .then((result) => {
          const { accessTokenSecret } = result;
          debug(`Authenticating token with secret ${accessTokenSecret}.`);
          //use the stored secret to validate the signature of the token
          authenticateTokenAsync(token, accessTokenSecret)
            .then((payload) => {
              //if the token is valid the payload is the decoded token in json format
              //we use the token payload to determine if the user is an admin
              //if not deny access to the route
              if (!payload || !payload.admin) return res.sendStatus(403);
              req.token = payload;
              debug('Token authenticated.');
              next();
            })
            .catch((err) => {
              error(err);
              res.status(401).send('Unauthorized.');
            });
        })
        .catch((err) => {
          error(err);
          return res.status(401).send('Unauthorized');
        });
    })
    .catch((err) => {
      error(err);
      return res.status(401).send('Unauthorized');
    });
};

module.exports = authorizeAdminRoutes;
