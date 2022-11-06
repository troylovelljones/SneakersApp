const { getController } = require('../../controller/registration-controller');
const router = require('../../../../core/server/routes/generic/public/public-routes');
const baseUrl = '/registration-api-server';

module.exports = async () => {
  const { registerUser } = await getController();
  router.route(baseUrl + '/register/user').post(registerUser);
  return router;
};
