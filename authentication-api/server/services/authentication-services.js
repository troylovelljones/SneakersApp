"use strict";

const devConstants = require('../../../core/development/dev-constants');
const { getSecrets } = require('../../../core/server/secrets/model/secrets');
const passwordService = require('../../../core/server/secrets/services/password');
const tokenService = require('../../../core/server/secrets/services/token');
const { getUserId } = require('../../../core/server/user/service/user');
const { throwError } = require('../../../core/validation/validation');

const { log, error, getModuleLoggingMetaData } = require('../../../logging/logger/global-logger')(module);
module.getModuleLoggingMetaData = getModuleLoggingMetaData;
const env = require('dotenv').config();
const NODE_ENV = process.env.NODE_ENV || 'development';
const ACCESS_TOKEN_DURATION = process.env.ACCESS_TOKEN_DURATION || devConstants.ACCESS_TOKEN_DURATION;


const createAndSaveTokens = async (id) => {
    //save the new token secrets that were generated when creating the tokens
    log('Creating tokens.');
    //valid credentials obtained so create a new access token
    const accessToken = await tokenService.createTokenAsync(
      id,
      'Access Token',
      ACCESS_TOKEN_DURATION
    );
    const refreshToken = await tokenService.createTokenAsync(id, 'Refresh Token');
    log('Tokens from createTokens(): ');
    log('Access Token = ');
    log(accessToken && JSON.stringify(accessToken, null, 2));
    log('Refresh Token = ');
    log(refreshToken && JSON.stringify(accessToken, null, 2));
    const tokens = { accessToken, refreshToken };
    await tokenService.saveTokensAsync(id, tokens);
    accessToken.id = id;
    refreshToken.id = id;
    return tokens;
  };
  
  const generateNewPassword = async (id) => {
    const newPassword = await passwordService.generateAndEncryptPassword();
    log('A new password was generated');
    await passwordService.saveEncryptedPassword(id,
      newPassword.encryptedPassword
    );
    NODE_ENV !== 'production' &&
      log(`Password = ${JSON.stringify(newPassword, null, 2)}`);
    delete newPassword.encryptedPassword;
    return newPassword;
  };
  
  const validatePassword = async (id, password) => {
    try {  
      log(`authentication services validatePassword().`);
      log(`Id = ${id}.`);
      const valid = await passwordService.validatePassword(id, password);
      log(`Valid = ${JSON.stringify(valid)}`)
      valid ? log('Credentials are valid or validation was skipped based on the value in the .cfg file.'.green) : log(`Invalid credentials for ${id }!`);
      return valid;
    } catch (e) {
        error('validatePassword() error.  Attempt to validate password failed.')
        throw e;
    }
  };

  const validateToken = async (id, token) =>{
    try {
      const Secrets = await getSecrets();
      const result = await Secrets.locateSecretsById(id , 'Access Token');
      const { accessTokenSecret } = result;
      log(`Authenticating token with secret ${accessTokenSecret}.`);
      const payload = tokenService.authenticateTokenAsync(
        token,
        accessTokenSecret
      );
      return payload;
      } catch(e) {
        error('Error around line 90 of authentication-services.js at validateToken().  Could not vaidate token .')
      }
  }

  module.exports = { createAndSaveTokens, getModuleLoggingMetaData, generateNewPassword, validatePassword, validateToken}