'use strict';
const env = require('dotenv').config();
const NODE_ENV = process.env.NODE_ENV || 'production';
const { getSecrets } = require('../model/secrets');
const { compare, hash } = require('bcrypt');
const { throwError } = require('../../../validation/validation');
const { info, error, getModuleLoggingMetaData } = require('../../../../logging/logger/global-logger')(module);
const { getUserId } = require('../../../../core/server/user/service/user');



const encryptPassword = async (password) => {
  try {
    process.env.NODE_ENV != 'production' && info(password);
    const encryptedPassword = await hash(password, 12);
    return encryptedPassword;
  } catch (e) {
      error(JSON.stringify(e));
      error(JSON.stringify(e.stack));
      error('Error encrptying password');
  }
};

const generateAndEncryptPassword = async () => {
  info('Creating a fresh password.');
  const Secrets = await getSecrets();
  const password = Secrets.generateSecret();
  const encryptedPassword = await encryptPassword(password);
  info(
    `New password: ${password}, new encrypted password: ${encryptedPassword}`
  );
  return { password, encryptedPassword };
};

const getEncryptedPassword = async (identifier) => {
  try {
    const Secrets = await getSecrets();
    info(`identifier = ${JSON.stringify(identifier, null, 2)}.`);
    info(identifier.serverId);
    info(`server id = ${serverId}`);
    info(`username = ${username}.`);
    const id = (username && await getUserId(username)) || serverId;
    info('Getting encrypted password for ' + (username || serverId));
    const secretKey = await Secrets.locateSecretsById(id);
    info('Got the secret key');
    info(JSON.stringify(secretKey, null, 2));
    if (secretKey) {
      const { password: encryptedPassword } = secretKey;
      const secret = (id, encryptedPassword);
      info('id = ');
      info(id);
      NODE_ENV != 'production' &&
        info('Encrypted Password = ') &&
        info(encryptedPassword);
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
    Secrets && info('Secrets loaded.');
    info(`Save encryptedPassword() id = ${id}`);
    const result = await Secrets.saveSecrets(id, { password });
    info('Saved encrypted password.');
    info('Secret: '.blue);
    info(result);
    return result;
  } catch (e) {
      error(JSON.stringify(e));
      e?.stack && error(JSON.stringify(e.stack));
      error('Error saving password!');
  }
};

const validatePassword = async (id, password) => {
  const Secrets = await getSecrets();
  info(`Searching for secrets related to ${id}.`)
  let result = await Secrets.locateSecretsById(id);
  info(`Encrypted password = ${result}.`);
  if (!result) return false;
  info(`Comparing ${password} to ${result.password}.`);
  result = await compare(password, result.password);
  result && info('Password matched!') || info('Password failed to match!');
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
