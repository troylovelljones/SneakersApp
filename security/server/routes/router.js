
const {register, login, getValidators} = require("../controllers/authController");
const express = require(`express`);

const DEBUG = true;

const authUrl = '/api/v1/login';
const regUrl = '/api/v1/register';
const validatorsUrl = '/core/js';


const router = express.Router();
router.route(authUrl).post(login);
router.route(regUrl).post(register);
//router.route(validatorsUrl).get(getValidators);


module.exports = router;