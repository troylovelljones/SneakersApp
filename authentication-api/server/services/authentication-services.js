"use strict";

const devConstants = require('../../../core/development/dev-constants');
const { getSecrets } = require('../../../core/server/secrets/model/secrets');
const passwordService = require('../../../core/server/secrets/services/password');
const tokenService = require('../../../core/server/secrets/services/token');

//environment variables
const env = require('dotenv').config();
const ACCESS_TOKEN_DURATION = process.env.ACCESS_TOKEN_DURATION || devConstants.ACCESS_TOKEN_DURATION;
const NODE_ENV = process.env.NODE_ENV || 'development';
const SERVER_NAME = process.env.SERVER_NAME || 'auth-api-svr';

const { debug, error, getModuleLoggingMetaData } = require('../../../logging/logger/global-logger')(module, SERVER_NAME);
module.getModuleLoggingMetaData = getModuleLoggingMetaData;

/**
 * Creates and save a refresh or access token for the entity identifier id
 * @async
 * @param {number} id Id to be saved along with other injfo
 */
const createAndSaveTokens = async (id) => {
    //save the new token secrets that were generated when creating the tokens
    debug('Creating tokens.');
    //valid credentials obtained so create a new access token
    const accessToken = await tokenService.createTokenAsync(id, 'Access Token', ACCESS_TOKEN_DURATION);
    const refreshToken = await tokenService.createTokenAsync(id, 'Refresh Token');
    debug('Tokens from createTokens(): ');
    debug('Access Token = ');
    debug(accessToken && `${JSON.stringify(accessToken, null, 2)}`);
    debug('Refresh Token = ');
    debug(refreshToken && `${JSON.stringify(accessToken, null, 2)}`);
    const tokens = { accessToken, refreshToken };
    await tokenService.saveTokensAsync(id, tokens);
    accessToken.id = id;
    refreshToken.id = id;
    return tokens;
  };
  
  /**
    * Creates and new password for the entity identifier id
    * @async
    * @param {number} id User/Server id associated with password
    * @returns {string} newPassword object containing the new encytped password
    */
  const generateNewPassword = async (id) => {
    const newPassword = await passwordService.generateAndEncryptPassword();
    debug('A new password was generated');
    await passwordService.saveEncryptedPassword(id, newPassword.encryptedPassword);
    NODE_ENV !== 'production' && debug(`Password = ${JSON.stringify(newPassword, null, 2)}`);
    delete newPassword.encryptedPassword;
    return newPassword;
  };
  
  /**
    * Valides password for user/server id.
    * @async
    * @param {number} id User/Server id associated with password
    */
  const validatePassword = async (id, password) => {
    try {  
      debug(`authentication services validatePassword().`);
      debug(`Id = ${id}.`);
      const valid = await passwordService.validatePassword(id, password);
      debug(`Valid = ${JSON.stringify(valid)}`)
      valid ? debug('Credentials are valid or validation was skipped based on the value in the .cfg file.'.green) : debug(`Invalid credentials for ${id }!`);
      return valid;
    } catch (e) {
        error('validatePassword() error.  Attempt to validate password failed.')
        throw e;
    }
  };
/**
  * Creates and save a refresh or access token for the entity identifier id
  * @async
  * @param {number} id User/Server id associated with password
  * @param {string} token/refresh token for this object
  * 
  */
  const validateToken = async (id, token) =>{
    try {
      const Secrets = await getSecrets();
      const result = await Secrets.locateSecretsById(id , 'Access Token');
      const { accessTokenSecret } = result;
      debug(`Authenticating token with secret ${accessTokenSecret}.`);
      const payload = tokenService.authenticateTokenAsync(token, accessTokenSecret);
      return payload;
      } catch(e) {
          error('Error around line 90 of authentication-services.js at validateToken().  Could not vaidate token .')
      }
  }

  module.exports = { createAndSaveTokens, getModuleLoggingMetaData, generateNewPassword, validatePassword, validateToken}