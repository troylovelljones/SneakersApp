
const {register, login} = require("../controllers/auth-controlller");
const express = require(`express`);

const DEBUG = true;
const baseUrl = '/sneakers'
const apiAuthUrl = '/api/v1/login';
const regUrl = '/api/v1/register';

//Post routes, get routes are handled by express.useStatic()
const router = express.Router();
router.route(baseUrl + apiAuthUrl).post(login);
router.route(baseUrl + regUrl).post(register);

module.exports = router;