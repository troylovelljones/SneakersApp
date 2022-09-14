
const baseController = require('../controllers/base-controller');
const express = require(`express`);

//this is the default router.  It performs a health check to make
//sure the sever is working correctly
const router = express.Router();

//the default controller makes a get request to the 
//admin/healthcheck route make sure things are configured correctly
const {test, kill, update} = baseController;

router.route('/admin/healthcheck').get(test);
router.route('/admin/kill').get(kill);
router.route('/admin/update').put(update);

//export the default router
module.exports = router;