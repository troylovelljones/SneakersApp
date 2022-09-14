const express = require(`express`);

const {getSneakers, getJordans} = require('../controllers/sneakers_api_controller');

const DEBUG = true;

const sneakersApi_url = '/api/v1/sneakers';
const apiServer_baseUrl = '/api-server';
const sneakers_url = '/getSneakers';
const jordans_url = '/getJordans/:limit';

//Post routes, get routes are handled by express.useStatic()
const router = express.Router();
router.route(sneakersApi_url.concat(sneakers_url)).get(getSneakers);
router.route(sneakersApi_url.concat(jordans_url)).get(getJordans);

module.exports = router;