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
const { log, error, getModuleLoggingMetaData } = require('../../../logging/logger/global-logger')(module);
const siteRegistrationEmail = require('../../email/site-registration-email');

const findUser = async (username) => {
  try {
    log('<----------Start findUser()---------->');
    const result = await getSneakerUserByUserName(username.toLowerCase());
    log(`Searching for user = ${username}.  Result = `);
    log(result)
    const record = result.next().value;
    record && log(USERNAME_EXISTS);
    log(JSON.stringify(record, null, 2));
    log('<----------End findUser()---------->');
    return record;
  } catch (e) {
    error(e);
    throw new Error('Unable to query database to find user!'.red);
  }
};
 
//---------this all needs to be replaced with JOI-------------//
const isValidUserInfo = (username, email, password) => {
  log(username, email, password);
  const validUsername =
    new RegExp(VALID_USER_NAME).test(username) || log('Bad Username!');
  const validEmail = RegExp(VALID_EMAIL).test(email) || log('Bad Email!');
  const validPassword =
    new RegExp(STRONG_PASSWORD).test(password) || log('Bad Password!');
  const validRegistration = validUsername && validEmail && validPassword;
  return validRegistration;
};
 
const registerServer = async (serverInfo) => {
  try {
    log('<----------Start registerServer() on the Registry Server---------->');
    log('Server Info: ');
    log(JSON.stringify(serverInfo));
    const { name, ipAddress, port, endPoints, status, serverId } = serverInfo;
    const Registry = await getRegistry();
    const result = await Registry.saveEntry(name, ipAddress, port, endPoints, status, serverId);
    log('<----------End registerServer() on the Registery Server---------->');
    return {status: 200, message: `Sucessfully registered server ${name}:${ipAddress}`, _id: result._id};
  } catch (e) {
      error(e);
      error(e.stack);
      return {status: 500, message: `HTTP 500 Internal Error`, _id: null};
  }
};
 
const registerUser = async (username, password, emailAddress) => {
  log('<----------Start registerUser() on the Registery Server---------->');
  log(`Request for Registration recieved at ${new Date()}`);
 
  const userExists = await findUser(username);
  if (userExists) {
    log(USERNAME_EXISTS);
    return { status: 400, message: USERNAME_EXISTS };
  }
 
  const validUserInfo = isValidUserInfo(username, emailAddress, password);
  if (!validUserInfo) {
    log('Bad user info!');
    return { status: 400, message: BAD_USER_INFO };
  }
 
  log(`-Registering User ${username}`);
  log(`- Register user payload = username: ${username}, password: ${password}, email:  ${emailAddress}`);
  const ePassword = await hash(password, 12);
  NODE_ENV !== 'production' && log(`-Password: ${password} encrypted as ` + `${ePassword}`);
  try {
    await startTransaction();
    log('Starting Transaction.');
    const userId = await insertSneakerUser(user);
    await saveEncryptedPassword({ userId }, ePassword);
    log(`Successful Registration for ${username} at ${new Date()}`);
    //send the user a nice registration email through Sendinblue
    log('Sending registration email.');
    siteRegistrationEmail.send(username, emailAddress);
    await commit();
    log('Commiting Transation.');
    log('<----------End registerUser() on the Registery Server---------->');
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
  