
console.log('Loading validators');

const STRONG_PASSWORD = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
const VALID_EMAIL = /^(.+)@(.+)$/;
const VALID_USER_NAME = /^(?=[a-zA-Z0-9._]{8,20}$)(?!.*[_.]{2})[^_.].*[^_.]$/;

REG_ERROR = 'An error occured during registration.  Please try again.';

BAD_LOGIN = 'Either the username or password was invalid!';

BAD_USER_INFO = `The registration information supplied was invalid.\n  Passwords must be at least` +
    `10 characters long with one uppercase letter, one number and one special character.  ` +
    `Usernames and email addresses cannot contain special characters.`;
BAD_USERNAME_PASSWORD =`Either username or password was incorrect.`;
USERNAME_EXISTS = `User Name exists. Please choose a different user name!`;

try {
        module.exports = {
    
            STRONG_PASSWORD,
            VALID_EMAIL,
            VALID_USER_NAME,
            REG_ERROR,
            BAD_USER_INFO,
            BAD_USERNAME_PASSWORD,
            USERNAME_EXISTS
        }  
        console.log('Validation file loaded on server.') 
    } catch (e) {
        console.log('Validation file loaded on client.');
    }

