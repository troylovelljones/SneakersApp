const {getApiServerInformation} = require("../controllers/appController");
const express = require(`express`);

const DEBUG = true;

const baseUrl = '/sneakers/apiServerInfo';

const router = express.Router();
router.route(baseUrl).get(getApiServerInformation);

module.exports = router;