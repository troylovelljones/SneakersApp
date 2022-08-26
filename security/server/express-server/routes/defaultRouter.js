
const defaultControllerPath = "../controllers/defaultController";
const defaultController = require("../controllers/defaultController");
const express = require(`express`);

//this is the default router.  It performs a health check to make
//sure the sever is working correctly
const router = express.Router();

//the default controller makes a get request to the 
//api/v1/healthcheck route make sure things are configured correctly
const {apiTest} = defaultController;
const baseURL = `/api/health`;
router.route(baseURL).get(apiTest);

//export the default router
module.exports = router;