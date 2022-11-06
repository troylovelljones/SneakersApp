const authorizeAdminRoutes = require('./authorize-admin-routes');
const { authorizeServerRoutes } = require('./authorize-servers-routes');
const authorizeUserRoutes = require('./authorize-users-routes');

const authorizationMiddlewareList = [];
authorizationMiddlewareList.push(authorizeAdminRoutes);
authorizationMiddlewareList.push(authorizeServerRoutes);
authorizationMiddlewareList.push(authorizeUserRoutes);

module.exports = { authorizationMiddlewareList, authorizeAdminRoutes, authorizeServerRoutes, authorizeUserRoutes};