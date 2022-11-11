"use strict";

const baseUrl = '/sneakers-logger-api';
const { getLogEntries, getModuleQualityMetrics, saveLogEntries, saveModuleQualityMetrices } = require('../controller/logs-controller');
const router = require('../../../core/server/routes/generic/public/public-routes');

router.route(baseUrl + '/server/logs').post(saveLogEntries).get(getLogEntries);
router.route(baseUrl + '/server/metrics').post(saveModuleQualityMetrices).get(getModuleQualityMetrics);

module.exports = router;
