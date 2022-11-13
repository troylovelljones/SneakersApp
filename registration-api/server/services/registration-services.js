"use strict"

const { hash } = require('bcrypt');
const {
  saveEncryptedPassword
} = require('../../../core/server/secrets/services/password');
const {
  commit,
  getSneakerUserByUserName,
  insertSneakerUser,
  startTransaction,
  rollback
} = require('../../../core/server/repository/sneaker-user-repository');
const {
  STRONG_PASSWORD,
  VALID_EMAIL,
  VALID_USER_NAME,
  USERNAME_EXISTS,
  REG_ERROR,
  BAD_USER_INFO
} = require('../../../core/validation/validation');
const { getRegistry } = require('../model/registry')
const {debug, error } = require('../../../logging/logger/global-logger')(module);
const siteRegistrationEmail = require('../../email/site-registration-email');

const findUser = async (username) => {
  try {
    debug('<----------Start findUser()---------->');
    const result = await getSneakerUserByUserName(username.toLowerCase());
    debug(`Searching for user = ${username}.  Result = `);
    debug(result)
    const record = result.next().value;
    record && debug(USERNAME_EXISTS);
    debug(JSON.stringify(record, null, 2));
    debug('<----------End findUser()---------->');
    return record;
  } catch (e) {
    error(e);
    throw new Error('Unable to query database to find user!'.red);
  }
};
 
//---------this all needs to be replaced with JOI-------------//
const isValidUserInfo = (username, email, password) => {
  debug(username, email, password);
  const validUsername =
    new RegExp(VALID_USER_NAME).test(username) || info('Bad Username!');
  const validEmail = RegExp(VALID_EMAIL).test(email) || debug('Bad Email!');
  const validPassword =
    new RegExp(STRONG_PASSWORD).test(password) || debug('Bad Password!');
  const validRegistration = validUsername && validEmail && validPassword;
  return validRegistration;
};
 
const registerServer = async (serverInfo) => {
  try {
    debug('<----------Start registerServer() on the Registry Server---------->');
    //log('Server Info: ');
    //log(JSON.stringify(serverdebug, null, 2));
    const { name, ipAddress, port, endPoints, status, serverId } = serverInfo;
    const Registry = await getRegistry();
    const result = await Registry.saveEntry(name, ipAddress, port, endPoints, status, serverId);
    debug('<----------End registerServer() on the Registery Server---------->');
    return {status: 200, message: `Sucessfully registered server ${name}:${ipAddress}`, _id: result._id};
  } catch (e) {
      error(e);
      error(e.stack);
      return {status: 500, message: `HTTP 500 Internal Error`, _id: null};
  }
};
 
const registerUser = async (username, password, emailAddress) => {
  debug('<----------Start registerUser() on the Registery Server---------->');
  debug(`Request for Registration recieved at ${new Date()}`);
 
  const userExists = await findUser(username);
  if (userExists) {
    debug(USERNAME_EXISTS);
    return { status: 400, message: USERNAME_EXISTS };
  }
 
  const validUserInfo = isValidUserInfo(username, emailAddress, password);
  if (!validUserInfo) {
    debug('Bad user info!');
    return { status: 400, message: BAD_USER_INFO };
  }
 
  debug(`-Registering User ${username}`);
  debug(`- Register user payload = username: ${username}, password: ${password}, email:  ${emailAddress}`);
  const ePassword = await hash(password, 12);
  NODE_ENV !== 'production' && debug(`-Password: ${password} encrypted as ` + `${ePassword}`);
  try {
    await startTransaction();
    debug('Starting Transaction.');
    const userId = await insertSneakerUser(user);
    await saveEncryptedPassword({ userId }, ePassword);
    debug(`Successful Registration for ${username} at ${new Date()}`);
    //send the user a nice registration email through Sendinblue
    debug('Sending registration email.');
    siteRegistrationEmail.send(username, emailAddress);
    await commit();
    debug('Commiting Transation.');
    debug('<----------End registerUser() on the Registery Server---------->');
    return { userId, status: 200, message: `Registration of ${username} Successful`};
  } catch (e) {
      error(`-Registration error`.red);
      error(e);
      error(e.stack);
      await rollback();
      return { status: 500, message: REG_ERROR, userId: null};
  }
};

module.exports = { registerServer, registerUser }
  