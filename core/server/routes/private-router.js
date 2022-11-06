'use strict;';
const basePrivateRouter = require('./private/base-private-router');
const privateRoutes = require('./private/private-routes');

//this is a router to service protected routes.
//Thisn includesnadmin functions by default
//i.e making sure the server is working correctly,
//shutting down the server, etc.
//all routes are authorized using jwt's
//only users with the admin role can access the admin endpoints

//protected admin routes
basePrivateRouter.use(privateRoutes)
module.exports = basePrivateRouter;
