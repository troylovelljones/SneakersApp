'use strict';

const router = require('../../../core/server/routes/generic/protected/protected-router');
const { getUserLoginUrls, setAppUrls } = require('../controller/user-login-app-controller');

router.route('/user-login-app/links').get(getUserLoginUrls);
router.setAppUrls = (sneaksAdminURl, authUrl, regUrl) => {
  setAppUrls(sneaksAdminURl, authUrl, regUrl);
};

module.exports = router;
