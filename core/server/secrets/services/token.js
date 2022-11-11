'use strict';

const env = require('dotenv').config();

const ACCESS_TOKEN_LIFE = process.env.ACCESS_TOKEN_REFRESH || '15m';
const REFRESH_TOKEN_LIFE = process.env.REFRESH_TOKEN_LIFE || '7d';
const { getSecrets } = require('../model/secrets');
const { sign, verify } = require('jsonwebtoken');
const { throwError } = require('../../../validation/validation');
const { info, error, getModuleLoggingMetaData } =
  require('../../../../logging/logger/global-logger')(module);

const authenticateTokenAsync = async (token, secret) => {
  return await new Promise((resolve, reject) => {
    try {
      info('<----------Start of authenticateTokenAsync()---------->'.cyan);
      info('Token parameter = ');
      info(`${JSON.stringify(token)}`);
      info('Database secret parameter = ');
      info(secret);
      !secret && throwError('HTTP 401 Unauthorized.');
      info('Validating token inside promise...');
      info('Token = ');
      info(`${JSON.stringify(token, null, 2)}`);
      info('Secret = ');
      info(`${JSON.stringify(secret, null, 2)}`);
      const payload = verify(token, secret);
      info('Payload.');
      info(`${JSON.stringify(payload, null, 2)}`);
      payload ? resolve(payload) : throwError('HTTP 401 Unauthorized.');
      info('<----------end of authenticateTokenAsync()---------->'.cyan);
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
  info('Generating token secret.');
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
    info('Token created.  Token = ');
    info(`${JSON.stringify(token)}`);
    info('Secret = ');
    info(`${JSON.stringify(secret)}`);
  });
};

const deleteTokenSecrets = (tokens) => {
  for (const token of tokens) delete token.secret;
  info('Deleting secrets deleted.');
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
  info('<----------Start of saveTokensAsync()---------->');
  const Secrets = await getSecrets();
  try {
    const result = await Secrets.saveSecret(
      { refreshToken: token },
      id,
      'Refresh Token'
    );
    info('<----------End of saveTokensAsync()---------->');
    return result;
  } catch (e) {
    error(`${JSON.stringify(e, null, 2)}`);
    error('Could not save secret!');
  }
};

const saveTokensAsync = async (id, tokens) => {
  try {
    const Secrets = await getSecrets();
    info('<----------Start of saveTokensAsync()---------->');
    Secrets && info('Secrets loaded.');
    info('Tokens - saveTokensAsync: ');
    const { accessToken, refreshToken } = tokens;
    info(`${JSON.stringify(accessToken, null, 2)}`);
    info(`${JSON.stringify(accessToken, null, 2)}`);
    //validate tokens before they are saved to the database
    accessToken && (await authenticateTokenAsync(accessToken.jwt, accessToken.secret));
    refreshToken && (await authenticateTokenAsync(refreshToken.jwt, refreshToken.secret));
    info(`${JSON.stringify(tokens, null, 2)}`);
    const result = await Secrets.saveSecrets(id, tokens);
    info('Saved secret.');
    info('Secret: '.blue);
    info(`${JSON.stringify(result, null,2)}`);
    info('Delete token secrets.');
    //delete the token secret;
    deleteTokenSecrets([accessToken, refreshToken]);
    info('Deleted.');
    info('<----------End of saveTokensAsync()---------->');
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
