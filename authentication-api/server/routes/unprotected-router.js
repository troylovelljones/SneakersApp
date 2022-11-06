'use strict';
const {
  authenticateServer,
  authenticateToken,
  authenticateUser
} = require('../controller/authentication-controller');
const baseUrl = '/authentication-api-server';
const colors = require('colors');
const unprotectedRouter = require('../../../core/server/routes/generic/public/public-routes');

//all route(s) below are unprotected routes
//servers will access the authenticater to prove their identity before registering
//after authenticating, they will recieve a json web token
unprotectedRouter.route(baseUrl + '/authenticate/server').post(authenticateServer);
unprotectedRouter.route(baseUrl + '/authenticate/user').post(authenticateUser);
unprotectedRouter.route(baseUrl + '/authenticate/token').post(authenticateToken);

module.exports = unprotectedRouter;
