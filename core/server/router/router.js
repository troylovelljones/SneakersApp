const express = require(`express`);
const router = express.Router();
const {redirectToSecurityApp} = require('../controller/redirectController');

console.log(redirectToSecurityApp);
router.route('/main').get(redirectToSecurityApp);

module.exports = router;