'use strict';

const { authenticateTokenAsync } = require('../../secrets/services/token');
const colors = require('colors');
const { getSecrets } = require('../../secrets/model/secrets');
const { getUserId } = require('../../user/service/user');
const { info, error, getModuleLoggingMetaData } =
  require('../../../../logging/logger/global-logger')(module);

//middleware to protect the routes
const authorizeUserRoutes = (req, res, next) => {
  getModuleLoggingMetaData.traceId = req.traceId;
  const clientIp = req.ip.includes('::ffff:') ? req.ip.split('::ffff:')[1] : req.ip;
  info('Checking if an user route has been requested by the client');

  req.username && getUserId(username)
    .then(userId => {
      info(`Requested route: ${req.url}`.blue);
      info('Authorize route for client');
      //make sure it's not admin router, if it is, skip user authorization
      if (!req.url.includes('users')) {
        info('Not a user route.');
        return next();
      }
      info('<----------start of authorizeUsreRoute()---------->'.magenta);
      info(`Authorizing route ${req.url}.`.magenta, `:${clientIp}`);
      //look for token in one of three places
      // 1. authorization header
      // 2. query string
     // 3. cookie
      const authHeader =
        req.headers['Authorization'] || req.headers['authorization'];
      info('HTTP Authorization Header = ');
      info(authHeader);
      const token =
        (authHeader && authHeader.split(' ')[1]) ||
        req?.query?.token ||
        req?.cookies?.Token ||
        req?.cookies?.token;
      info(`Validating token = ${token}.`, `:${userId}`);
      if (token == null) {
        info(`Request of '${req.url}' denied!`);
        return res.status(401).send('Unauthorized.');
      }
      getSecrets()
        .then((Secrets) => {
          Secrets.locateSecretsByUserId(userId)
            .then((result) => {
              const { accessTokenSecret } = result;
              info(`Access token secret = ${accessTokenSecret}`);
              //locate the token secret in the database
              //if the secret is not found, reject the request
              if (!accessTokenSecret) return res.status(401).send('Unauthorized');
              info(`Authenticating user ${userId} with secret ${accessTokenSecret}.`);
              authenticateTokenAsync(token, accessTokenSecret)
                .then((payload) => {
                  info('Authorization Successful'.green);
                  //add the token to an httpOnly cookie and the authorization header
                  !res.get('Authorization') &&
                  res.set('Authorization', `Bearer = ${token}`);
                  res.cookie('token', token);
                  res.cookie('httpOnly', true);
                  res.cookie('secure', true);
                  req.token = payload;
                  info('<------------Route Authorized------------>\n'.green);
                  info('<----------End of authorizeRoutes()---------->'.magenta);
                  next();
              
                })
                .catch(err => {
                  error(err);
                  return res.status(500).send('HTTP 500 Internal Error');
                });
            })
            .catch(err => {
                error(err);
                return res.status(500).send('HTTP 500 Internal Error');
            });
    })
    .catch(err => {
      error(err);
      return res.status(500).send('HTTP 500 Internal Error.');
    });
  });
  !req.username && info('Not a user requested route') && next();
}

module.exports = authorizeUserRoutes;
