'use strict';

const env = require('dotenv').config();

const ACCESS_TOKEN_LIFE = process.env.ACCESS_TOKEN_REFRESH || '15m';
const REFRESH_TOKEN_LIFE = process.env.REFRESH_TOKEN_LIFE || '7d';
const { getSecrets } = require('../model/secrets');
const { sign, verify } = require('jsonwebtoken');
const { throwError } = require('../../../validation/validation');
const { log, error, getModuleLoggingMetaData } =
  require('../../../../logging/logger/global-logger')(module);

const authenticateTokenAsync = async (token, secret) => {
  return await new Promise((resolve, reject) => {
    try {
      log('<----------Start of authenticateTokenAsync()---------->'.cyan);
      log('Token parameter = ');
      log(token);
      log('Database secret parameter = ');
      log(secret);
      !secret && throwError('HTTP 401 Unauthorized.');
      log('Validating token inside promise...');
      log('Token = ');
      log(JSON.stringify(token, null, 2));
      log('Secret = ');
      log(JSON.stringify(secret));
      const payload = verify(token, secret);
      log('Payload.');
      log(JSON.stringify(payload));
      payload ? resolve(payload) : throwError('HTTP 401 Unauthorized.');
      log('<----------end of authenticateTokenAsync()---------->'.cyan);
    } catch (e) {
      e && error(JSON.stringify(e));
      e.stack && error(JSON.stringify(e.stack));
      reject(new Error('Invalid Token'));
    }
  });
};

//this method attaches the secret used to create the token
//the secret MUST be deleted from the object before sending to the client
const createTokenAsync = async (id, tokenType, expiration) => {
  log('Generating token secret.');
  const Secrets = await getSecrets();
  const secret = Secrets.generateSecret();
  if (!expiration) {
    switch (tokenType) {
      case 'Access Token':
        expiration = { expiresIn: ACCESS_TOKEN_LIFE };
        break;
      case 'Refresh Token':
        expiration = { expiresIn: REFRESH_TOKEN_LIFE };
        break;
    }
  } else expiration = { expiresIn: expiration };

  const payload = { id, tokenType, expiration };

  return await new Promise((resolve, reject) => {
    const signedPayload = sign(payload, secret, expiration);
    if (!signedPayload) {
      reject(new Error('Token could not be signed.'));
      return;
    }
    const token = { jwt: signedPayload, secret, tokenType, id };
    resolve(token);
    log('Token created.  Token = ');
    log(JSON.stringify(token));
    log('Secret = ');
    log(JSON.stringify(secret));
  });
};

const deleteTokenSecrets = (tokens) => {
  for (const token of tokens) delete token.secret;
  log('Deleting secrets deleted.');
};

const getTokenSecretsById = async (id) => {
  try {
    const Secrets = await getSecrets();
    const secrets = Secrets.locateSecretsById(id);
    const { accessTokenSecret, refreshTokenSecret } = secrets;
    return { accessTokenSecret, refreshTokenSecret };
  } catch(e) {
    error('Error locating token!');
    throw e;
  }
};

const saveRefreshTokenAsync = async (token, id) => {
  log('<----------Start of saveTokensAsync()---------->');
  const Secrets = await getSecrets();
  try {
    const result = await Secrets.saveSecret(
      { refreshToken: token },
      id,
      'Refresh Token'
    );
    log('<----------End of saveTokensAsync()---------->');
    return result;
  } catch (e) {
    error(JSON.stringify(e));
    error('Could not save secret!');
  }
};

const saveTokensAsync = async (id, tokens) => {
  try {
    const Secrets = await getSecrets();
    log('<----------Start of saveTokensAsync()---------->');
    Secrets && log('Secrets loaded.');
    log('Tokens - saveTokensAsync: ');
    const { accessToken, refreshToken } = tokens;
    log(JSON.stringify(accessToken));
    log(JSON.stringify(accessToken));
    //validate tokens before they are saved to the database
    accessToken && (await authenticateTokenAsync(accessToken.jwt, accessToken.secret));
    refreshToken && (await authenticateTokenAsync(refreshToken.jwt, refreshToken.secret));
    log(tokens);
    const result = await Secrets.saveSecrets(id, tokens);
    log('Saved secret.');
    log('Secret: '.blue);
    log(result);
    log('Delete token secrets.');
    //delete the token secret;
    deleteTokenSecrets([accessToken, refreshToken]);
    log('Deleted.');
    log('<----------End of saveTokensAsync()---------->');
    return result;
  } catch(e) {
    error('Error saving tokens');
    throw e;
  }
};

module.exports = {
  authenticateTokenAsync,
  createTokenAsync,
  deleteTokenSecrets,
  getModuleLoggingMetaData,
  getTokenSecretsById,
  saveRefreshTokenAsync,
  saveTokensAsync
};
