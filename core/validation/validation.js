'use strict';
const NEED_MATCHING_PASSWORDS = 'The passwords you entered must match!';
const BLANK_INFO = 'User Name, password, email address cannot be blank!';
const NO_API_SERVER =
  'The server is temporarily unavailable.  Please try again later.';
const STRONG_PASSWORD =
  /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
const VALID_EMAIL = /^(.+)@(.+)$/;
const VALID_USER = /^(?=[a-zA-Z0-9._]{8,20}$)(?!.*[_.]{2})[^_.].*[^_.]$/;
const VALID_INPUT = /^(?=[a-zA-Z0-9._]{1,}$)(?!.*[_.]{2})[^_.].*[^_.]$/;
const REG_ERROR = 'An error occured during registration.  Please try again.';
const BAD_LOGIN = 'Either the username or password was invalid!';

const BAD_USER_INFO =
  `The registration information supplied was invalid.  Passwords must be at least` +
  ' 10 characters long with one uppercase letter, one number and one special character.  ' +
  'Usernames cannot contain special characters. Email addresses must be entered as "address@domain,.com';

const BAD_USERNAME_PASSWORD =
  'Unable to validate your username and password.  Please try again.';
const USERNAME_EXISTS = `User Name exists. Please choose a different user name!`;
const SERVER_UNAVAILABLE = `The server is currently unavailabe.  Please try again later.`;
const throwError = (message) => {
  throw new Error(message);
};
//remove all unprintable characters from the string
const sanitizeString = (str) => {
  return str.replace(
    /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g,
    ''
  );
};

try {
  module.exports = {
    sanitizeString,
    throwError,
    NEED_MATCHING_PASSWORDS: `The passwords you entered must match!`,
    BLANK_INFO: `User Name, password, email address cannot be blank!`,
    NO_API_SERVER:
      'The server is temporarily unavailable.  Please try again later.',
    STRONG_PASSWORD:
      /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/,
    VALID_EMAIL: /^(.+)@(.+)$/,
    VALID_USER: /^(?=[a-zA-Z0-9._]{8,20}$)(?!.*[_.]{2})[^_.].*[^_.]$/,

    VALID_INPUT: /^(?=[a-zA-Z0-9._]{1,}$)(?!.*[_.]{2})[^_.].*[^_.]$/,
    REG_ERROR:
      'An error occured during registration.  Please make sure you do not have an ' +
      'active account.',

    BAD_LOGIN: 'Either the username or password was invalid!',

    BAD_USER_INFO:
      `The registration information supplied was invalid.  Passwords must be at least` +
      ` 10 characters long with one uppercase letter, one number and one special character.  ` +
      `Usernames and email addresses cannot contain special characters.`,
    BAD_USERNAME_PASSWORD: `Either username or password was incorrect.`,
    USERNAME_EXISTS: `User Name exists. Please choose a different user name!`,
    SERVER_UNAVAILABLE: `The server is currently unavailabe.  Please try again later.`
    //remove all unprintable characters from the string
  };
} catch (e) {
  //we're operting on a broswer and do not have access to the logger
  if (!window) {
    const { error } = require('../../logging/logger/global-logger')(module);
    error(JSON.stringify(e.stack, null, 2));
    error('Validation file may not be loaded');
  }   
  else console.error(e.stack);

}
