"use strict"

const { getSneakers, getJordans } = require('../controllers/sneakers-api-controller');

const sneakersApiUrl = '/sneakers-api-server';
const sneakersUrl = '/getSneakers';
const jordansUrl = '/getJordans/:limit';

//Post routes, get routes are handled by express.useStatic()
const protectedRouter = require('../../../core/server/routes/private-routes/protected-router');
protectedRouter.route(sneakersApiUrl.concat(sneakersUrl)).get(getSneakers);
protectedRouter.route(sneakersApiUrl.concat(jordansUrl)).get(getJordans);

module.exports = protectedRouter;