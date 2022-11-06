"use strict"
const baseUrl = '/registration-api-server';
const colors = require('colors');
const { getController } = require('../../controller/registration-controller');
const protectedRouter = require('../../../../core/server/routes/generic/protected/protected-router');
const throwError = require('../../../../core/validation/validation.js');

const getProtectedRouter = async () => {
  const appRegistryController = await getController();
  appRegistryController && !console.log('Sucessfully loaded App Registry Controller'.green) || throwError('Could not load App Registry Controller!');
  const { registerServer, locate, update } = await getController();
  //all route(s) below are protected routes
  //servers will need to present a valid authorization token to access the endpoint
  protectedRouter.route(baseUrl + '/register/server').post(registerServer).put(update);
  protectedRouter.route(baseUrl + '/locate/server').get(locate);
  protectedRouter.route(baseUrl + '/update/server').put(update);
  return protectedRouter;
};

module.exports = getProtectedRouter;
