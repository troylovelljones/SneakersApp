const users = {};
const SNEAKER_APP_DB = '../../../core/server/repositories/sneakers_app_database';
const SNEAKER_USER_REPO = '../../../sneakers/server/repositories/sneaker_user_repository';
const VALIDATORS = "../../../core/data-validation/validation";
const bcrypt = require('bcrypt');
const sequelize = require(SNEAKER_APP_DB);
const path = require('path');
const {
  
  getSneakerUserByUserName, 
  insertSneakerUser, 
  updateSneakerUser

} = require(SNEAKER_USER_REPO);

const {

  STRONG_PASSWORD, VALID_EMAIL, 
  VALID_USER_NAME, 
  REG_ERROR, 
  BAD_USER_INFO, 
  BAD_USERNAME_PASSWORD

} = require(VALIDATORS);
const { Console } = console;
const {log, dir, group, groupEnd} = new Console({colorMode: true, groupIndentation: 3,
  stdout: process.stdout, stderr: process.stderr});

String.prototype.orNot = function (condition) {
  return condition ? this.toString() : `not ${this.toString()}`;
};

module.exports = {


    login: async (req, res) => {
      
      copyUser = (user) => {return {...user}};
      
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
      try {
        
        !bcrypt.compareSync(password, password) && new Error('Password could not be verified');
         
      } catch(e) {  
          console.log(`Error with password validation!`.red);
          console.log(e);  
          res.status(400).send(BAD_USERNAME_PASSWORD);
          return;
      }

      const sanitizedUserRecord = {};
      sanitizedUserRecord.username = username;
      sanitizedUserRecord.lastLogIn = sneakerUser.last_login_at;
      res.status(200).send(sanitizedUserRecord); 
          
      groupEnd();
      log(`Credential verification for ${username} was ${'successful'.orNot(sanitizedUserRecord)}`
          + ` at ${new Date()}`);

    },
    
    register: async (req, res) => {
        group(`Reuest for Registration recieved at ${new Date()}`);
        
        const {username, password, firstname, lastname, email} = req.body;
        try {
          const result = await getSneakerUserByUserName(username.toLowerCase());
            if (result.next().value) {

              res.status(400).send(USERNAME_EXISTS);
              return;
            }
        } catch (e) {
            console.log(e);
            throw new Error('Unable to query database to find user!'.red);
          }

        const invalidRegistration = (new RegExp(VALID_USER_NAME).test(username) && RegExp(VALID_EMAIL).test(email)) &&
        new RegExp(STRONG_PASSWORD).test(password);
        
        if (invalidRegistration) {
          res.status(400).send(BAD_USER_INFO);
          return;
        }
        
     
          log(`-Registering User ${username}`);
          log(`- Register user payload = username: ${username}, password: ${password},\n`
          + `firstname: ${firstname}, lastname: ${lastname},`
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
          `${user.encryptedPassword}`);
        log(`-User object created: ${user}`);
        log(`-Encrypted password generated`);
        
        try {
          await insertSneakerUser(user, {}, {generateByDefault: true});
          
        } catch (e) {
          log(`-Registration error`.red);
          console.log(e);
          res.status(500).send(REG_ERROR);
          groupEnd();
          return;
        }
        delete user.password;
        
        res.status(200).send(user);
        
        groupEnd();
        log(`Successful Registration for ${username}`
          + ` at ${new Date()}`);
        
    }
}
