'use strict';
const env = require('dotenv').config();
const NODE_ENV = process.env.NODE_ENV || 'production';
const { getSecrets } = require('../model/secrets');
const { compare, hash } = require('bcrypt');
const { throwError } = require('../../../validation/validation');
const { debug, error, getModuleLoggingMetaData } = require('../../../../logging/logger/global-logger')(module);
const { getUserId } = require('../../../../core/server/user/service/user');



const encryptPassword = async (password) => {
  try {
    process.env.NODE_ENV != 'production' && debug(password);
    const encryptedPassword = await hash(password, 12);
    return encryptedPassword;
  } catch (e) {
      error(JSON.stringify(e));
      error(JSON.stringify(e.stack));
      error('Error encrptying password');
  }
};

const generateAndEncryptPassword = async () => {
  debug('Creating a fresh password.');
  const Secrets = await getSecrets();
  const password = Secrets.generateSecret();
  const encryptedPassword = await encryptPassword(password);
  debug(
    `New password: ${password}, new encrypted password: ${encryptedPassword}`
  );
  return { password, encryptedPassword };
};

const getEncryptedPassword = async (identifier) => {
  try {
    const Secrets = await getSecrets();
    debug(`identifier = ${JSON.stringify(identifier, null, 2)}.`);
    debug(identifier.serverId);
    debug(`server id = ${serverId}`);
    debug(`username = ${username}.`);
    const id = (username && await getUserId(username)) || serverId;
    debug('Getting encrypted password for ' + (username || serverId));
    const secretKey = await Secrets.locateSecretsById(id);
    debug('Got the secret key');
    debug(JSON.stringify(secretKey, null, 2));
    if (secretKey) {
      const { password: encryptedPassword } = secretKey;
      const secret = (id, encryptedPassword);
      debug('id = ');
      debug(id);
      NODE_ENV != 'production' &&
        debug('Encrypted Password = ') &&
        debug(encryptedPassword);
      return secret;
    } else return null;
  } catch(e) {
      error(JSON.stringify(e.stack));
      throwError('Error in getEncryptedPassword!')
  }
};

const saveEncryptedPassword = async (id, password) => {
  try {
    const Secrets = await getSecrets();
    Secrets && debug('Secrets loaded.');
    debug(`Save encryptedPassword() id = ${id}`);
    const result = await Secrets.saveSecrets(id, { password });
    debug('Saved encrypted password.');
    debug('Secret: '.blue);
    debug(result);
    return result;
  } catch (e) {
      error(JSON.stringify(e));
      e?.stack && error(JSON.stringify(e.stack));
      error('Error saving password!');
  }
};

const validatePassword = async (id, password) => {
  const Secrets = await getSecrets();
  debug(`Searching for secrets related to ${id}.`)
  let result = await Secrets.locateSecretsById(id);
  debug(`Encrypted password = ${result}.`);
  if (!result) return false;
  debug(`Comparing ${password} to ${result.password}.`);
  result = await compare(password, result.password);
  result && debug('Password matched!') || debug('Password failed to match!');
  return true;
};

module.exports = {
  encryptPassword,
  generateAndEncryptPassword,
  getEncryptedPassword,
  getModuleLoggingMetaData,
  saveEncryptedPassword,
  validatePassword
};
