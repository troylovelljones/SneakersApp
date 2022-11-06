'use strict';
const env = require('dotenv').config();
const NODE_ENV = process.env.NODE_ENV || 'production';
const { getSecrets } = require('../model/secrets');
const { compare, hash } = require('bcrypt');
const { throwError } = require('../../../validation/validation');
const { log, error, getModuleLoggingMetaData } = require('../../../../logging/logger/global-logger')(module);
const { getUserId } = require('../../../../core/server/user/service/user');



const encryptPassword = async (password) => {
  try {
    process.env.NODE_ENV != 'production' && log(password);
    const encryptedPassword = await hash(password, 12);
    return encryptedPassword;
  } catch (e) {
    error(JSON.stringify(e));
    error(JSON.stringify(e.stack));
    error('Error encrptying password');
  }
};

const generateAndEncryptPassword = async () => {
  log('Creating a fresh password.');
  const Secrets = await getSecrets();
  const password = Secrets.generateSecret();
  const encryptedPassword = await encryptPassword(password);
  log(
    `New password: ${password}, new encrypted password: ${encryptedPassword}`
  );
  return { password, encryptedPassword };
};

const getEncryptedPassword = async (identifier) => {
  try {
    const Secrets = await getSecrets();
    log(`identifier = ${JSON.stringify(identifier, null, 2)}.`);
    console.log(identifier.serverId);
    log(`server id = ${serverId}`);
    log(`username = ${username}.`);
    const id = (username && await getUserId(username)) || serverId;
    log('Getting encrypted password for ' + (username || serverId));
    const secretKey = await Secrets.locateSecretsById(id);
    log('Got the secret key');
    log(JSON.stringify(secretKey, null, 2));
    if (secretKey) {
      const { password: encryptedPassword } = secretKey;
      const secret = (id, encryptedPassword);
      log('id = ');
      log(id);
      NODE_ENV != 'production' &&
        log('Encrypted Password = ') &&
        log(encryptedPassword);
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
    Secrets && log('Secrets loaded.');
    log(`Save encryptedPassword() id = ${id}`);
    const result = await Secrets.saveSecrets(id, { password });
    log('Saved encrypted password.');
    log('Secret: '.blue);
    log(result);
    return result;
  } catch (e) {
    error(JSON.stringify(e));
    error(JSON.stringify(e));
    error('Error saving password!');
  }
};

const validatePassword = async (id, password) => {
  const Secrets = await getSecrets();
  log(`Searching for secrets related to ${id}.`)
  let result = await Secrets.locateSecretsById(id);
  log(`Encrypted password = ${result}.`);
  if (!result) return false;
  log(`Comparing ${password} to ${result.password}.`);
  result = await compare(password, result.password);
  result && log('Password matched!') || log('Password failed to match!');
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
