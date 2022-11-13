'use strict';

const env = require('dotenv').config();

const ACCESS_TOKEN_LIFE = process.env.ACCESS_TOKEN_REFRESH || '15m';
const REFRESH_TOKEN_LIFE = process.env.REFRESH_TOKEN_LIFE || '7d';
const { getSecrets } = require('../model/secrets');
const { sign, verify } = require('jsonwebtoken');
const { throwError } = require('../../../validation/validation');
const { debug, error, getModuleLoggingMetaData } =
  require('../../../../logging/logger/global-logger')(module);

const authenticateTokenAsync = async (token, secret) => {
  return await new Promise((resolve, reject) => {
    try {
      debug('<----------Start of authenticateTokenAsync()---------->'.cyan);
      debug('Token parameter = ');
      debug(`${JSON.stringify(token)}`);
      debug('Database secret parameter = ');
      debug(secret);
      !secret && throwError('HTTP 401 Unauthorized.');
      debug('Validating token inside promise...');
      debug('Token = ');
      debug(`${JSON.stringify(token, null, 2)}`);
      debug('Secret = ');
      debug(`${JSON.stringify(secret, null, 2)}`);
      const payload = verify(token, secret);
      debug('Payload.');
      debug(`${JSON.stringify(payload, null, 2)}`);
      payload ? resolve(payload) : throwError('HTTP 401 Unauthorized.');
      debug('<----------end of authenticateTokenAsync()---------->'.cyan);
    } catch (e) {
      e && error(`${JSON.stringify(e, null, 2)}`);
      e.stack && error(`${JSON.stringify(e.stack, null, 2)}`);
      reject(new Error('Invalid Token'));
    }
  });
};

//this method attaches the secret used to create the token
//the secret MUST be deleted from the object before sending to the client
const createTokenAsync = async (id, tokenType, expiration) => {
  debug('Generating token secret.');
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
    debug('Token created.  Token = ');
    debug(`${JSON.stringify(token)}`);
    debug('Secret = ');
    debug(`${JSON.stringify(secret)}`);
  });
};

const deleteTokenSecrets = (tokens) => {
  for (const token of tokens) delete token.secret;
  debug('Deleting secrets deleted.');
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
  debug('<----------Start of saveTokensAsync()---------->');
  const Secrets = await getSecrets();
  try {
    const result = await Secrets.saveSecret(
      { refreshToken: token },
      id,
      'Refresh Token'
    );
    debug('<----------End of saveTokensAsync()---------->');
    return result;
  } catch (e) {
    error(`${JSON.stringify(e, null, 2)}`);
    error('Could not save secret!');
  }
};

const saveTokensAsync = async (id, tokens) => {
  try {
    const Secrets = await getSecrets();
    debug('<----------Start of saveTokensAsync()---------->');
    Secrets && debug('Secrets loaded.');
    debug('Tokens - saveTokensAsync: ');
    const { accessToken, refreshToken } = tokens;
    debug(`${JSON.stringify(accessToken, null, 2)}`);
    debug(`${JSON.stringify(accessToken, null, 2)}`);
    //validate tokens before they are saved to the database
    accessToken && (await authenticateTokenAsync(accessToken.jwt, accessToken.secret));
    refreshToken && (await authenticateTokenAsync(refreshToken.jwt, refreshToken.secret));
    debug(`${JSON.stringify(tokens, null, 2)}`);
    const result = await Secrets.saveSecrets(id, tokens);
    debug('Saved secret.');
    debug('Secret: '.blue);
    debug(`${JSON.stringify(result, null,2)}`);
    debug('Delete token secrets.');
    //delete the token secret;
    deleteTokenSecrets([accessToken, refreshToken]);
    debug('Deleted.');
    debug('<----------End of saveTokensAsync()---------->');
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
