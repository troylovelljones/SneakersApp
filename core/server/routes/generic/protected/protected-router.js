
"user strict"
const express = require('express');
const { kill, update } = require('../../../controller/admin-controller')
protectedRouter = express.Router();
protectedRouter.route('/admin/update').put(update);
protectedRouter.route('/admin/kill').post(kill);
module.exports = protectedRouter;