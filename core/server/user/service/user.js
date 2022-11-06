'use strict';
const { getSneakerUserByUserName } = require('../../repository/sneaker-user-repository'); 
const { log, error } = require('../../../../logging/logger/global-logger')(module);
const { throwError } = require('../../../validation/validation');

const getUserId = async (username) => {
    try {
      !username && error('Username cannot be null') && throwError();
      const user = username && await getSneakerUserByUserName(username);
     
      log('User info = ');
      log(username);
      log(JSON.stringify(user, null, 2));
      //get the user id
      const userId = user[0].id
      log(`User id from getUserId ${userId}`);
      return userId;
    } catch(e) {
      error(`Unable to locate user ${username}.`);
      throw e
    }
  };

  module.exports = { getUserId };