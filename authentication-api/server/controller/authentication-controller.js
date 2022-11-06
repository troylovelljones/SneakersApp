'use strict';

const appUtils = require('../../../core/server/utils/app-utils');
const authenticationService = require('../services/authentication-services');
const configService = require('../../../config/config-file');
const config = configService.getConfigFile(require('path').resolve(__dirname, '../.cfg'));
const dependencies = Array.from(appUtils.getModuleDependencies(module))
const devConstants = require('../../../core/development/dev-constants');
const env = require('dotenv').config();
const tokenService = require('../../../core/server/secrets/services/token');

const ACCESS_TOKEN_DURATION = process.env.ACCESS_TOKEN_DURATION || devConstants.ACCESS_TOKEN_DURATION;
const HOST_IP_ADDRESS = require('../../../core/development/dev-constants').HOST_IP_ADDRESS;
const REGISTRATION_SERVER_URL = process.env.REGISTRATION_URL || devConstants.REGISTRATION_SERVER_URL;
const REGISTER_SERVER_URL = process.env.REGISTER_SERVER_URL || devConstants.REGISTER_SERVER_URL;
const REGISTRATION_URL = REGISTRATION_SERVER_URL + REGISTER_SERVER_URL;

const { getUserId } = require('../../../core/server/user/service/user')
const { updateModuleLoggingMetaData } = require('../../../logging/logger/logger-manager');
const { createAndSaveTokens, generateNewPassword, validatePassword, validateToken } = require('../services/authentication-services');
const { error, log, getModuleLoggingMetaData } = require('../../../logging/logger/global-logger')(module);

module.getDependencies = () => dependencies;
module.getModuleLoggingMetaData = getModuleLoggingMetaData;




const NODE_ENV = process.env.NODE_ENV || 'production';

module.exports = {
  authenticateServer: async (req, res) => {
    const clientIp = req.ip.split('::ffff:')[1];
    const traceId = req.traceId;
    log(`Request trace id = ${traceId}`);
    const phase = clientIp === HOST_IP_ADDRESS ? 'startup' : 'ready';
    updateModuleLoggingMetaData(module, { clientIp, traceId, phase });
    log('<------------------REQUEST RECIEVED---------------->.'.cyan);
    try {
      log('Logging configuration');
      log(JSON.stringify(getModuleLoggingMetaData()));
      log('<------------START OF authenticateServer() ------>.'.gray);
      log('Authentication request recieved.');
      const skipAuthentication = await config.getValueFromConfigFile('SKIP_AUTHENTICATION');
      const refreshPassword = await config.getValueFromConfigFile('REFRESH_PASSWORD');
      log(`Skip authentication = ${skipAuthentication}`);
      log(`Refresh Password = ${refreshPassword}`);
      const { serverId , password } = req.body;
      if (!serverId) return res.status(401).send('Missing server id!');
      NODE_ENV !='production' && log(`serverId = ${serverId}, password = ${password}`);
      const validPassword = skipAuthentication || await validatePassword(serverId, password);
      if (!validPassword) return res.status(401).send(`Missing creditials for ${serverId}!`);
      const newPassword = refreshPassword && log('generating a new password') && await generateNewPassword(serverId);
      const tokens = log('Creating access tokens.') && await createAndSaveTokens(serverId, ACCESS_TOKEN_DURATION);
      log(`Server ${serverId} authorized!`);
      log('Resetting clientIp and phase logging metadata');
      updateModuleLoggingMetaData(module, {clientIp: null, phase: 'ready'});
      NODE_ENV !== 'production' && 
        log(`New secret = ${newPassword}.`) && 
        log(`Tokens = ${JSON.stringify(tokens)}.`) &&
        log(`TraceId = ${traceId}.`);

      res.status(200).send(newPassword && log('Sending new password') && { newPassword, tokens, traceId, registrationUrl: REGISTRATION_URL } || { tokens, traceId, registrationUrl: REGISTRATION_URL });
      //try not to add any code that could cause an error after saving the new password/tokens and before sending the response  
      log('Authorization complete, data sent.');
      log('<----------END OF authenticateServer()---------->');
      log('<------------------RESPONSE SENT----------------->.'.green);
  
    } catch (e) {
        error(e.stack);
        !res.headersSent && res.status(500).send('Server Error!');
    }
  },

  authenticateToken: async (req, res) => {
    try {
      const id = req.id;
      const token = req.token;
      const payload = validateToken(id, accessTokenSecret);
      //if the token is valid the payload is the decoded token in json format
      //we use the token payload to determine if the user is an admin
      //if not deny access to the route
      if (!payload || !payload.admin) return res.sendStatus(403);
      res.token = payload;
      log('Token authenticated.');
      return res.status(200).send('Authorized');
    } catch (e) {
      error(e);
      return res.status(401).send('Unauthorized');
    }
  },

  authenticateUser: async (req, res) => {
    try {
      log(`The request body = ${JSON.stringify(req.body, null, 2)}`);

      log('Authentication request recieved.');
      const { username, password } = req.body;
      log(`username = `);
      log(username);
      NODE_ENV != 'production' && !
        log(`password = `) &&
        log(password);
      const id = await getUserId(username);
      const valid = await validatePassword(id, password);
      log(`Authenticating User ${id}`);
      log(`Valid = ${valid}`);
      if (!valid) {
        log('Invalid credentials.'.red);
        return res.status(401).send('Unauthorized Access.');
      } else log('Credentials are valid.'.green);
      if (!id) return res.status(401).send('User is not registered.');
      //save the new token secrets that were generated when creating the token
      const tokens = await authenticationService.createAndSaveTokens(id);
      //save the new token secrets that were generated when creating the token
      log(`User ${id} authorized!`);
      log('----RESPONSE SENT----.'.green);
      return res.status(200).send({ message: 'success', statusCode: 200,  tokens }); //this needs to be the last line, otherwise exception handling will generate an unhandled exception
     
    } catch (e) {
      error(JSON.stringify(e));
      error(JSON.stringify(e.stack), null, 2);
      !res.headersSent && res.status(500).send('Internal Server Error!'); //will generate an error if response already sent
    }
  },

  refreshToken: async (req, res) => {
    try {
      const token = req.query.token;
      const type = req.query.type;
      const id = req.query.id;
      log('Refreshing token = ');
      log(token);
      log(`For id: ${id}`);
      const { accessTokenSecret, refreshTokenSecret } =
        await token.getTokenSecretsById(id);
      const secret =
        (type.includes('Access') && accessTokenSecret) || refreshTokenSecret;
      const payload = await token.authenticateTokenAsync(token, secret, type);
      const newToken = payload ? await createTokens(id) : null;
      newToken && (await saveSecrets(id, newToken, newToken.refreshToken));
      res.set('Authorization', `Bearer ${token.jwt}`);
      log(`Sending new token ${newToken.jwt}.`);
      return res.status(200).send(newToken);
    } catch (e) {
      error(JSON.stringify(e));
      error(JSON.stringify(e));
      error('Error refreshing token');
    }
  },

  getModuleLoggingMetaData,

  update: async (req, res) => {
    //can only access this endpoint with an ipAddress
    if (!req.ipAddress) return res.status(403).send('Unauthorized');
    locateServerUrl = req.body.url;
    res.status(200).send(`Url ${url} received.`);
  }
}


