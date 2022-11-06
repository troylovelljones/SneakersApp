'use strict';

const privateRouter = require('../../../core/server/routes/generic/protected/protected-router');
const {
  getLinks,
  getRefreshedTokens,
  setToken,
  setRefreshTokenUrl,
  setLinks
} = require('../controllers/sneakers-app-controller');

privateRouter.route('/sneaker-app-server/links').get(getLinks);
privateRouter.route('/sneaker-app-server/refreshToken').get(getRefreshedTokens);

module.exports = {
  privateRouter,
  setRefreshTokenUrl,
  setToken,
  setLinks
};
