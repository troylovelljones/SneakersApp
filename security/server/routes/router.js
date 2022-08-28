
const {register, login, getValidators} = require("../controllers/authController");
const express = require(`express`);

const DEBUG = true;

const apiAuthUrl = '/api/v1/login';
const regUrl = '/api/v1/register';

//Post routes, get routes are handled by express.useStatic()
const router = express.Router();
router.route(apiAuthUrl).post(login);
router.route(regUrl).post(register);

module.exports = router;