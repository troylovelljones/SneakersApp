'use strict';

const axios = require('axios');
const devContants = require('../../../core/development/dev-constants');
const { deleteTokenSecrets } = require('../../../core/server/secrets/model/secrets');
const { getModuleName } = require('../../../core/server/utils/extended-app-utils');
const FIFTEEN_MINUTES = devContants.FIFTEEN_MINUTES;
const logger = require('../../../logging/logger/global-logger');
const moduleLoggingMetaData = {
  module: getModuleName,
  phase: 'startup',
  format: 'default-msg'
};

const Value = () => {
  let value;
  return {
    set: (newValue) => {
      value = newValue;
    },
    get: () => {
      return value;
    }
  };
};

const Links = Value();
const Token = Value();

const setValue = (Value) => {
  return (value) => {
    Value.set(value);
  };
};

const setLinks = setValue(Links);
const setToken = setValue(Token);

const error = (message) => {
  log(message, 'error', metaData);
};

module.exports = {
  getLinks: async (req, res) => {
    const links = Links.get();
    try {
      logger('Sending links', metaData);
      res.status(200).send(links);
    } catch (e) {
      error(e, metaData);
      return res.status(500).send('Internal Server Error!');
    }
  },

  getRefreshedTokens: async (req, res) => {
    try {
      log(req.query, metaData);
      const { id, token, type } = req.query;
      let { refreshTokenUrl } = Links.get();
      refreshTokenUrl = refreshTokenUrl
        .replace('%TOKEN', token)
        .replace('%TYPE', type)
        .replace('%ID', id);
      log('Refresh Url.', metaData);
      log(url, metaData);
      const response = await axios.get(url);
      const newToken = response.data;
      res.clearCookie('token');
      res.clearCookie('Token');
      log('New token = ', metaData);
      log(newToken, metaData);
      res.set('Authorization', `Bearer: ${newToken.jwt}`);
      const options = {
        expires: new Date(Date.now() + FIFTEEN_MINUTES),
        httpOnly: true,
        secure: true
      };
      deleteTokenSecrets([newToken, newToken.refreshToken]);
      res.cookie('token', newToken.jwt, options);
      return res.status(200).send(newToken);
    } catch (e) {
      error('Error refreshing token.', metaData);
      error(e, metaData);
      error(e.stack, metaData);
      res.status(500).send('Internal Server Error!');
    }
  },
  setLinks,
  setToken
};
