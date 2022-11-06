'use strict';

const colors = require('colors');
const createSecretsSchema = require('./secrets-schema');
const { error, log, getModuleLoggingMetaData } = require('../../../../logging/logger/global-logger')(module);
const { generateUniqueKey } = require('../../utils/extended-app-utils');
const getConnection = require('../../repository/databases/mongodb/mongo-database');
const { getModel } = require('../../repository/databases/mongodb/model/model');
const { throwError } = require('../../../validation/validation');

const getSecrets = async () => {
  try {
      await getConnection();
      const Secrets = await getModel('Secrets', createSecretsSchema);
      Secrets && log('Sucessfully loaded Secrets Model'.green);
      !Secrets && throwError('Could not load Secrets Model!');

      Secrets.locateSecretsById = async (id) => {
        try {
          log(`Searching for `.magenta + `${id}'s secret.`.blue);
          const result = await Secrets.findOne({id}).exec();
          log('Search result');
          log(JSON.stringify(result, null, 2));
          result ? log(`Located secret.`) : log('Could not locate secret.'.yellow);
          return result;
        } catch (e) {
            e && error(JSON.stringify(e));
            e.stack && error(JSON.stringify(e.stack));
            error('Error'.red);
            error(` locateEntry() error.  Error locating secret for server ${id}.`);
            throw e;
        }
      };

      Secrets.locateSecretsByToken = async (token, tokenType) => {
        log(`Searching for secrets using token: `.magenta + `${token}`.blue);
        try {
          log('<----------start of locateSecretsByToken()---------->'.cyan);
          log(tokenType + '= ');
          log(token);
          const criteria = (tokenType.toUpperCase().includes('ACCESS') && { accessToken: token }) || (tokenType.toUpperCase().includes('REFRESH') && { refreshToken: token });
          log(`Searching secrets by token.  Token = ${JSON.stringify(token)}`);
          const result = await Secrets.findOne(criteria).exec();
          result && log(`Located secret.`.green) && log(result);
          !result && log('Could not locate secret.'.yellow);
          log('<----------end of locateSecretsByToken()---------->');
          return result || {};
        } catch (e) {
            e && error(e, metaData);
            e.stack && error(JSON.stringify(e.stack));
            error('Error');
            error(`locateEntry() error.  Error locating secret for server`);
          throw e;
        }
      };

      Secrets.saveSecrets = async (id, secrets) => {
        try {
          log('<----------start of saveSecrets()---------->'.cyan);
          log('Tokens - saveSecrets(): ');
          log(JSON.stringify(secrets, null, 2));
          const { accessToken, refreshToken, password } = secrets;
          const doc = await Secrets.locateSecretsById(id);
          log('Tokens-69');
          const { authenticateTokenAsync } = require('../services/token');
          accessToken && authenticateTokenAsync(accessToken.jwt, accessToken.secret);
          refreshToken && authenticateTokenAsync(refreshToken.jwt, refreshToken.secret);
          //update existing secret
          if (doc && Object.keys(doc).length > 0) {
            log(`Updating secret for ${id}.`.blue);
            log(doc);
            doc.accessToken =
              (accessToken && accessToken.jwt) || doc.accessToken;
            doc.accessTokenSecret =
              (accessToken && accessToken.secret) || doc.accessTokenSecret;
            doc.refreshToken =
              (refreshToken && refreshToken.jwt) || doc.refreshToken;
            doc.refreshTokenSecret =
              (refreshToken && refreshToken.secret) || doc.refreshTokenSecret;
            doc.password = password || doc.password;
            const result = await doc.save();
            return result;
          }
          log(`Saving secrets document for id = ${id}.`)
          //this needs to be refactored.  Shouldn't be passing an object to this function!!
          //or create a new secret
         
          const result = await new Secrets({
            id,
            accessToken: accessToken && accessToken.jwt,
            accessTokenSecret: accessToken && accessToken.secret,
            refreshToken: refreshToken && refreshToken.jwt,
            refreshTokenSecret: refreshToken && refreshToken.secret,
            password
          }).save();
          log(`Secrets saved.`, 'green');
          log('<----------end of saveSecrets()---------->'.cyan);
          return result;
        } catch (e) {
            error('saveSecret() error');
            e.stack && error(e.stack); //always log javaScript error stack
            throw e;
        }
      };

      Secrets.generateSecret = () => {
        return generateUniqueKey();
      };

      return Secrets;

  } catch (e) {
      error(JSON.stringify(e));
      error(JSON.stringify(e.stack));
      throw new Error('getSecrets() error.  There was an error while creating the Secrets Model');
  }
};

module.exports = { getSecrets, getModuleLoggingMetaData };
