"use strict"

const axios = require('axios');
const output = require('dotenv').config();
const colors = require('colors');
const bcrypt = require('bcrypt');
const { throwError } = require('../../../core/server/base-sneakers-app-server/base-server');
const siteRegistrationEmail = require('./site-registration-email');

const {
  getSneakerUserByUserName, 
  insertSneakerUser, 
} = require('../../../sneakers/server/repositories/sneaker_user_repository');

const {
  STRONG_PASSWORD, VALID_EMAIL, 
  VALID_USER_NAME, 
  USERNAME_EXISTS,
  REG_ERROR, 
  BAD_USER_INFO, 
  BAD_USERNAME_PASSWORD
} = require("../../../core/data-validation/validation")

const { Console } = console;

const {log, dir, group, groupEnd} = new Console({colorMode: true, groupIndentation: 3,
  stdout: process.stdout, stderr: process.stderr});

String.prototype.orNot = function (condition) {
  return condition ? this.toString() : `not ${this.toString()}`;
};

!output && throwError(output.message);
const SNEAKERS_REGISTRY = process.env.SNEAKERS_REGISTRY || 
  'http://localhost:4500/sneakers/app-registration-server/locate?servername=$';

const locateSneakersApp = async () => {
  try {
    const url = SNEAKERS_REGISTRY.replace('$', 'Sneakers App');
    const result = axios.get(url);
    return result;
  } catch (e) {
      e.stack && console.log(e.stack);
      console.log(e);
  }
   
}

module.exports = {

    login: async (req, res) => {
      
      const { username, password } = req.body;
      group(`Request recieved to log in user ${username} at ${Date()}`);
      dir(`-Request body: ${req.body}`, 2);
      log(`-Login in the user: ${username}`);
      
      let sneakerUser = await getSneakerUserByUserName(username);
      console.log(sneakerUser);
      log(`-User ${username} was ${'found'.orNot(sneakerUser)} in the database`);
       sneakerUser && log(`-Login in the user as ${username} with password ${password}`);
      sneakerUser = sneakerUser && sneakerUser.next();
      console.log(sneakerUser);
      console.log(`Passing the follwing items to BCrypt username: ${username} & password: ${password}`);
      let errorMessage = `Error with password validation!`;
      try {
        
        !bcrypt.compareSync(password, password) && new Error('Password could not be verified');
        errorMessage = `Could not locate Sneakers App!`
        const results = await locateSneakersApp();
        const {ipAddress, port} = results.data;
        const sanitizedUserRecord = {};
        sanitizedUserRecord.username = username;
        sanitizedUserRecord.lastLogIn = sneakerUser.last_login_at;              
        groupEnd();
        log(`Credential verification for ${username} was ${'successful'.orNot(sanitizedUserRecord)}`
          + ` at ${new Date()}`);
        const fakeAppIpAddress = "http://localhost:";
        const url = `${fakeAppIpAddress + port}/`;
        console.log(`Redirecting app to ${fakeAppIpAddress + port}/`);
        res.status(200).send({url});
         
      } catch(e) {  
          console.log(errorMessage.red);
          console.log(e);  
          res.status(400).send(BAD_USERNAME_PASSWORD);
          return;
      }
    },
    
    register: async (req, res) => {
        group(`Reuest for Registration recieved at ${new Date()}`);
        const {username, password, email} = req.body;
        try {
          const result = await getSneakerUserByUserName(username.toLowerCase());
            if (result.next().value) {
              console.log(USERNAME_EXISTS);
              res.status(400).send(USERNAME_EXISTS);
              return;
            }
        } catch (e) {
            console.log(e.stack);
            throw new Error('Unable to query database to find user!'.red);
          }

        const validUsername = new RegExp(VALID_USER_NAME).
          test(username) || console.log('Bad Username!');
        const validEmail = RegExp(VALID_EMAIL).
          test(email) || console.log('Bad Email!');
        const validPassword = new RegExp(STRONG_PASSWORD).
          test(password) || console.log('Bad Password!');
        const validRegistration = validUsername &&
          validEmail && validPassword;  
        
        if (!validRegistration) {
          console.log('Bad user info!')
          res.status(400).send(BAD_USER_INFO);
          return;
        }
        
        log(`-Registering User ${username}`);
        log(`- Register user payload = username: ${username}, password: ${password},\n`
          + ` email:  ${email}`);
        const originalUsername = username;
        const ePassword = bcrypt.hashSync(password, 12);
        const user = {
          username: username.toLowerCase(),
          email, 
          password: ePassword,
        };
        user.username = originalUsername;
        
        log(`-Password: ${password} encrypted as ` +
          `${ePassword}`);
        log(`-User object created: ${user}`);
        log(`-Encrypted password generated`);
        
        try {
          let result = await insertSneakerUser(user, {}, {generateByDefault: true});
          delete user.password;
          res.status(200).send(user);
          console.log(result);
          groupEnd();
          log(`Successful Registration for ${username}`
            + ` at ${new Date()}`);
          siteRegistrationEmail.send(originalUsername, email);
    
        } catch (e) {
          log(`-Registration error`.red);
          log(e);
          e?.stack && console.log(e.stack);
          res.status(500).send(REG_ERROR);
          groupEnd();
        
          return;
        }
                
    }
}
