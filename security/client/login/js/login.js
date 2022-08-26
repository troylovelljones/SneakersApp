const userContainer = document.querySelector('#user-info');
const loginForm = document.querySelector('#login-form');
const registerForm = document.querySelector('#register-form');
const messageDisplay = document.querySelector('.errors');

const DEBUG = true;

const DOMAIN_NAME = DEBUG && `http://localhost:` || `https://yoursneakercollection.com`;
const SERVER_PORT = 4000;

const BAD_LOGIN = 'Your username or password is not correct';
const BAD_REG = 'Your registration information is invalid.  \n\nPlease make sure your username contains only' +
' letters and numbers and your password contains letters, numbers, at least one special character' +
' and at least one uppercase letter.';
const BLANK_INFO = `You must enter a value for username, password, and email address!`;
const NEED_MATCHING_PASSWORDS = `The passwords you entered to not match!`;
const UNEXPECTED_ERROR = `An unexpected error occured. Please try to register at a later time`;


const authUrl = '/api/v1/register';
const regUrl = '/api/v1/register';
const baseUrl = `${DOMAIN_NAME}`;

import {STRONG_PASSWORD, VALID_EMAIL, VALID_USER_NAME} from "../../../../core/data-validation/validation.js";



const login = body => {
    axios.post(`${baseUrl + SERVER_PORT + authUrl}`, body).then( res => {
  createUserCard(res.data);
  console.log(res.data);
}).catch(err => {
  console.log(err);
  alert(err.response.data);

})}
const register = async (body) => {
    
  const REGISTRATION_SUCCESS = `You were successfully registered as ${username}!`

  console.log(`register`);
    console.log(body);
    axios.post(`${baseUrl + SERVER_PORT + regUrl}`, body).then(res => {
        console.log(res.data); 
        const username = response.data.username;
        displayMessages(REGISTRATION_SUCCESS);
    
    }).catch(err => {
        console.log(err);
        displayMessages(err.response.data);
    });
}

//.catch(err => {
//console.log(err)
//alert(err.response.data);
//})}


const valid = 'valid';

//values not passed as assumed to be valid, values can be 
//passed as 'valid' as a placeholder to allow subseqent real values to be passed
const isValidInput = (strUsername = valid, strPassword = valid,
   strEmail = valid) => {

    const testValue = (value, regex) => { 

      console.log(`Evaluating ${value}`);
      
      const evaluator = new RegExp(regex);
  
     (evaluator.test(value) && !console.log(`${value} is valid!`)) ||
        console.log(`${value} is not valid!`)
      
      return value === valid || evaluator.test(value);

    }

    const validInput = 
      testValue(strUsername, VALID_USER_NAME) &&
      testValue(strPassword, STRONG_PASSWORD) &&
      testValue(strEmail, VALID_EMAIL);
    
    return validInput;

}

const blankInputs = (strUsername, strPassword, strEmail) => {
  console.log(`Checking input fields for blanks...`);
  console.log(strUsername, strPassword, strEmail);
  return !(strUsername && strPassword && strEmail);
}

function loginSubmitHandler(e) {
    e.preventDefault();
    
    let username = document.querySelector('#login-username');
    let password = document.querySelector('#login-password');

    if (isValidInput(username.value, password.value)) {
      displayErrors(BAD_LOGIN);
      return;
    }

    let bodyObj = {
        username: username.value,
        password: password.value
    }

    login(bodyObj)

    username.value = ''
    password.value = ''
}

async function registerSubmitHandler(e) {
  e.preventDefault()

  let username = document.querySelector('#register-username');
  let email = document.querySelector('#register-email');
  let password = document.querySelector('#register-password');
  let password2 = document.querySelector('#register-password-2');

  console.log(username, password, email);
  console.log(`Username: ` + 
    ` ${username.value} ` + 
    ` password: ` + 
    ` ${password.value}` +
    ` email: ${email.value}`);

  const badPasswordMatch = password.value !== password2.value;
  const badInput = !isValidInput(username.value, password.value, email.value);
  const noInput = blankInputs(username.value, password.value, email.value)
  
  const error =  noInput && displayErrors(BLANK_INFO) ||
  badInput && displayErrors(BAD_REG) ||
  badPasswordMatch && displayErrors(NEED_MATCHING_PASSWORDS);

  if (error) return;

  console.log('Preparing to send registration information...');
  
  const bodyObj = {

  }

  bodyObj.username = username.value;
  bodyObj.email = email.value;
  bodyObj.password = password.value;
 
  const result = await register(bodyObj);
  
}

const displayMessages = (message) => {
  console.log(errorDisplay);
  errorDisplay.classList.add('show');
  errorDisplay.textContent = message;
  console.log(errorDisplay.classList);
  return true;

}

const clearFieldsHideErrors = () => {
  username.value = '';
  email.value = '';
  password.value = '';
  password2.value = '';
  hideMessages();
}

const hideMessages = () => {
  errorDisplay.classList.remove('show');
  errorDisplay.textContent = '';
}


function createUserCard(data) {
    userContainer.innerHTML = ''
    const userCard = document.createElement('div')
    userCard.classList.add('user-card')

    userCard.innerHTML = `<p class="username">User Name: ${data.username}</p>
    <p class="email">Email: ${data.email}</p>`

    


    userContainer.appendChild(userCard)
}

loginForm.addEventListener('submit', loginSubmitHandler)
registerForm.addEventListener('submit', registerSubmitHandler)