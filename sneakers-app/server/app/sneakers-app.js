//core node modules
const colors = require('colors');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const debug = require('defaultLogger')('sneakers-app:info');
const devConstants = require('../../../core/development/dev-constants');
const express = require('express');
const EventEmitter = require('events');
const path = require('path');

//environment variables
const envVars = require('dotenv').config();
const PORT = process.env.PORT || 4600;
const SERVER_NAME = process.env.SERVER_NAME || 'sneakers-app-server';
const IP_ADDRESS = process.env.IP_ADDRESS;
const REGISTRATION_SERVER_URL =
  process.env.REGISTRATION_SERVER_URL || devConstants.REGISTRATION_SERVER_URL;
const REGISTER_SERVER_URL =
  process.env.REGISTER_SERVER_URL || devConstants.REGISTER_SERVER_URL;
const REGISTRATION_URL = REGISTRATION_SERVER_URL + REGISTER_SERVER_URL;
const PROTOCOL = process.env.PROTOCOL || devConstants.PROTOCOL;
const AUTH_URL = process.env.AUTH_URL || devConstants.AUTH_URL;
const AUTHENTICATE_URL =
  (process.env.AUTH_URL || devConstants.AUTH_URL) +
  (process.env.AUTH_SERVER_URL || devConstants.AUTH_SERVER_URL);
const SECRET_KEY = process.env.SECRET_KEY;
const LOGIN_APP = process.env.LOGIN_APP || 'user-login-app';
const SNEAKERS_API = process.env.SNEAKERS_API || 'sneakers-api-server';
const LOGIN_LINK = process.env.LOGIN_LINK || devConstants.LOGIN_LINK;
const REFRESH_TOKEN_URL =
  process.env.REFRESH_TOKEN_URL || devConstants.REFRESH_TOKEN_URL;

const app = express();
const locateServer = require('../../../core/locate/locate-server')(
  REGISTRATION_SERVER_URL
);

//static content links
const CSS_LINK = '/css';
const JS_LINK = '/js';
const VALIDATOR_LINK = '/validation';
const IMAGES_LINK = '/images';
const ICONS_LINK = '/icons';

const {
  authenticateServer,
  getRoutingInformation,
  onAppTermination,
  registerServer,
  startApp,
  throwError
} = require('../../../core/server/app/services/app-services');

envVars.error && !debug(envVars) && throwError(envVars.error);

const {
  hostStaticFiles
} = require('../../../core/server/middleware/general-middleware');
const publicRouter = require('../../../core/server/routes/generic/public/public-router');
const routerPrivacy = require('../../../core/server/routes/generic/base-private-router');
const {
  privateRouter,
  setLinks,
  setToken
} = require('../routes/private-app-router');
const devConstants = require('../../../core/development/dev-constants');
const { LOCAL_IP } = require('../../../core/development/dev-constants');

debug('Root directory ' + __dirname);
debug(path.resolve(__dirname, '../../client/html'));
const options = { fallthrough: true, displayRoutes: false };

const installStaticHostingMiddleware = (app) => {
  //set up static hosting for sneakers website
  hostStaticFiles(
    app,
    path.resolve(__dirname, '../../../core/data-validation/'),
    VALIDATOR_LINK,
    options
  );
  hostStaticFiles(
    app,
    path.resolve(__dirname, '../../client/css/'),
    CSS_LINK,
    options
  );
  hostStaticFiles(
    app,
    path.resolve(__dirname, '../../client/js'),
    JS_LINK,
    options
  );
  hostStaticFiles(
    app,
    path.resolve(__dirname, '../../client/images'),
    IMAGES_LINK,
    options
  );
  hostStaticFiles(
    app,
    path.resolve(__dirname, '../../client/icons'),
    ICONS_LINK,
    options
  );
  options.index = 'sneakers-page.html';
  hostStaticFiles(
    app,
    path.resolve(__dirname, '../../client/html'),
    '/',
    options
  );
};

/*class UserEventEmitter extends EventEmitter {
  updateUser(id, token, tokenType) {
    debug('New User.');
    this.emit('user-update', { id, token, tokenType });
  }
}*/

/*const userEventEmitter = new UserEventEmitter();
userEventEmitter.on('user-update', setToken);*/

const getLogoutUrl = async (token) => {
  const authServer = await locateServer(LOGIN_APP, token);
  debug('IP Address = ');
  debug(module.ipAddress);
  const logoutUrl = `${PROTOCOL}://${module.ipAddress}/${LOGIN_LINK}`;
  return logoutUrl;
};

const getLinks = async () => {
  const { endPoints } = await locateServer(SNEAKERS_API, token);
  debug(endPoints);
  const jordansSearchUrl = endPoints.filter((endPoint) =>
    endPoint.includes('getJordans')
  )[0];
  const sneakerSearchUrl = endPoints.filter((endPoint) =>
    endPoint.includes('getSneakers')
  )[0];
  const logoutUrl = getLogoutUrl(token);
  const refreshTokenUrl = AUTH_URL + REFRESH_TOKEN_URL;
  return { jordansSearchUrl, logoutUrl, refreshTokenUrl, sneakerSearchUrl };
};

// set a cookie
const getUrls = (userEventEmitter) => {
  return (req, res, next) => {
    debug('Inspecting requests');
    debug(req.query);
    debug(req.originalUrl);
    const userId = req?.query && req?.query?.id;
    const tokenType = req?.query && req?.query?.type;
    const token = req.query && req?.query?.token;
    const currentUser = module.user;
    if (!currentUser || currentUser.userId != userId) {
      //userEventEmitter.updateUser(userId, token, tokenType);
      //module.user = { id: userId, token, tokenType };
    }
    next(); // <-- important!
  };
};

(async () => {
  //install middleware
  try {
    module.ipAddress = IP_ADDRESS || devConstants.LOCAL_IP();
    debug(`Starting ${SERVER_NAME}.`);
    app.use(express.json());
    app.use(cors());
    //need to install cookieParser
    //middleware before we can do
    //anything with cookies
    app.use(cookieParser());
    app.use(publicRouter);
    app.use(routerPrivacy);
    //app.use(getUrls(userEventEmitter));
    installStaticHostingMiddleware(app);
    app.use(privateRouter);
    const response = await authenticateServer(
      SERVER_NAME,
      IP_ADDRESS,
      SECRET_KEY,
      AUTHENTICATE_URL
    );
    token = response.data;
    debug('Auth successful.  Token = ');
    debug(token);
    const info = {
      name: SERVER_NAME,
      ipAddress: IP_ADDRESS,
      port: PORT,
      endPoints: getRoutingInformation(app)
    };
    //register server so it can be discovered remotely
    await registerServer(REGISTRATION_URL, info, token);
    const links = await getLinks();
    setLinks(links);
    debug(`Starting ${SERVER_NAME}.`);
    const httpServer = await startApp(app, SERVER_NAME, PORT);
    onAppTermination(httpServer, IP_ADDRESS, REGISTRATION_SERVER_URL, token);
  } catch (e) {
    console.log(e);
    throw e;
  }
})();
