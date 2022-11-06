'use strict';
const { request } = require('express');
const express = require(`express`);
const router = express.Router();
const { test } = require('../../../controller/admin-controller');
router.route('/admin/healthcheck').get(test);
module.exports = router;
