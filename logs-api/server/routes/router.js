"use strict";

const baseUrl = '/sneaker-logger-api';
const { getLogEntries, saveLogEntries } = require('../controller/logs-controller');
const router = require('../../../core/server/routes/generic/public/public-routes');

router.route(baseUrl + '/server/logs').post(saveLogEntries).get(getLogEntries);

module.exports = router;
