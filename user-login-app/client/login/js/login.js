"use strict"

const userContainer = document.querySelector('#user-info');
const loginForm = document.querySelector('#login-form');
const registerForm = document.querySelector('#register-form');
const notificationWindow = document.getElementById('notification-window');
const apiServerInfo = {};

const blankInputs = (strUsername, strPassword, strEmail) => {
  console.log(`Checking input fields for blanks...`);
  console.log(strUsername, strPassword, strEmail);
  return !(strUsername || strPassword || strEmail);
}

const checkForInvalidInput = (username, password, password2, email) => {
  
  const badPasswordMatch = password.value !== password2.value;
  const badInput = !isValidInput(username.value, password.value, email.value);
  const noInput = blankInputs(username.value, password.value, email.value)
  const error =  noInput && 
    displayMessage(BLANK_INFO) ||
    badInput && displayMessage(BAD_REG) ||
    badPasswordMatch && 
    displayMessage(NEED_MATCHING_PASSWORDS);

  return error
}

const clearFields = () => {
  document.getElementById('register-username').placeholder = 'username';
  document.getElementById('register-username').value = '';
  document.getElementById('login-username').placeholder = 'username';
  document.getElementById('login-username').value = '';
  document.getElementById('register-email').value = '';
  document.getElementById('register-email').placeholder = 'email';
  document.getElementById('register-password').value = '';
  document.getElementById('register-password').value = 'password';
  document.getElementById('register-password-2').value = '';
  document.getElementById('register-password-2').placeholder = 'confirm password';
  document.getElementById('login-password').placeholder = 'password';
  document.getElementById('login-password').value = '';
}

const clearFieldsHideErrors = () => {
  clearFields();
  hideMessages();
}

const constructUser = () => {
    let [_username, _password] = ["", ""];
  
    return {
        getUsername : () => _username,
        setUsername : (username) => _username = username,
        setPassword: (password) => _password = password,
        getPassword: () => _password
        
      }
}

const user = constructUser();

const displayMessage = (message) => {
  console.log(`We need to display a message: ${message}.`);
  notificationWindow.classList.add('show');
  notificationWindow.textContent = message;
  return true;

}

const getApiServerInfo = (data) => {
  const authUrl = data.auth;
  const regUrl = data.reg
  const adminUrl = data.admin;

  console.log(`Registration Server link ${regUrl}.`);
  console.log(`Authorization Server link ${authUrl}.`);
  console.log(`Sneakers Server link ${adminUrl}.`);
  updateApiServerInfo({ authUrl, regUrl, adminUrl });
 
}

const getUserDataFromHtmlForm = (source) => {

  return source === 'Registration-Form' && {
    username: document.getElementById('register-username'),
    email: document.getElementById('register-email'),
    password: document.getElementById('register-password'),
    password2: document.getElementById('register-password-2'),
  } || 
  {
    username: document.getElementById('login-username'), 
    password: document.getElementById('login-password')
  }
}

const getUserLoginUrls = async () => {
  const url = location.protocol
  .concat('//')
  .concat(location.hostname)
  .concat(':')
  .concat(location.port)
  .concat('/user-login-app/links');
  try {
    console.log(url);
    const response =  await axios.get(url);
    return response.data;
  }
  catch (e) {
    console.log(e);
    console.log(e.stack);
    displayMessage('Encountered an error contacting the server. Please refresh the page and try again.');
  }

}

const hideMessages = () => {
  console.log('removing message window from screen.');
  notificationWindow.classList.remove('show');
  notificationWindow.textContent = '';
}

const valid = 'valid';

//values not passed as assumed to be valid, values can be 
//passed as 'valid' as a placeholder to allow subseqent real values to be passed
const isValidInput = (strUsername = valid, strPassword = valid,
   strEmail = valid) => {

    const testValue = (value, regex) => { 

      valid && console.log(`Default value passed in.  Returning 'true'`);
      if (valid) return true;
      console.log(`Evaluating ${value}`);
      const evaluator = new RegExp(regex);
      (evaluator.test(value) && !console.log(`${value} is valid!`)) ||
        console.log(`${value} is not valid!`)
      
        return value === valid || evaluator.test(value);

    }

    const validInput = 
      testValue(strUsername, VALID_USER) && 
      !console.log('Good username') &&
      testValue(strPassword, STRONG_PASSWORD) &&
      !console.log('Good password.') &&
      testValue(strEmail, VALID_EMAIL) &&
      !console.log('Good email.');
    
    return validInput;

}

const login = user => {

  console.log('Posting login information to: ');  
  const { authUrl, sneaksUrl, adminUrl } = apiServerInfo;
  console.log(apiServerInfo.authUrl);
  user = { username: user.getUsername(), password: user.getPassword() }
  axios.post(`${authUrl}`, user).then( response => {
    //const { jwt, tokenType } = response.data;
    //const payload = JSON.parse(window.atob(jwt.split('.')[1]));
    //console.log(payload);
    //console.log(sneaksUrl);
    //const { id, expiration } = payload;
    //console.log('token, id, expiration');
    //console.log(jwt, id, expiration);
    //redirect on successful login
    //window.location.replace(adminUrl + `?token=${jwt}&type=${tokenType}&id=${id}`);
    console.log(adminUrl);
    window.location.replace('http://' + adminUrl);

}).catch(err => {
  console.log(err);
    console.log(err.message);    
    err?.message.includes('401') && displayMessage('The username and password you entered cannot be found in our database!') ||
      displayMessage('There was a problem accessing the server.  Please try again.');

})}

function loginSubmitHandler(e) {
  e.preventDefault();
  
  if (noAvailableApiServer()) {
    displayMessage(NO_API_SERVER);
    return;
  }
  const {username, password}  = getUserDataFromHtmlForm();

  if (!isValidInput(username.value, password.value)) {
    displayMessage(BAD_LOGIN);
    return;
  }
  user.setUsername(username.value);
  user.setPassword(password.value);

  console.log('Ready to log the user in.');
  login(user)

  username.value = '';
  password.value = '';
}

const noAvailableApiServer = () => {
  return Object.keys(apiServerInfo).length === 0;
}

const register = userInfo => {
    
  const username = userInfo.username;
  const emailAddress = userInfo.emailAddress
  const REGISTRATION_SUCCESS = `You were successfully registered as ${username}!` +
    ` with an email address of ${emailAddress}`;

  console.log(`register`);
  axios.post(apiServerInfo.regUrl, userInfo).then(response => {
    console.log('answer');
    console.log(response.data);
    console.log(response.data);
    displayMessage(REGISTRATION_SUCCESS);
    clearFields();
    
  }).catch(err => {
      console.log('We got an error.');
      console.log(err);
      displayMessage(err.response.data);
  });
}

async function registerSubmitHandler(e) {
  e.preventDefault();
  
  if (noAvailableApiServer()) {
    displayMessage(NO_API_SERVER);
    return;
  }
  
  const {username, email, password, password2} = getUserDataFromHtmlForm('Registration-Form');

  if (!isValidInput(username.value, password.value)) {
    displayMessage(BAD_LOGIN);
    return;
  }

  console.log(username, password, email);
  console.log(`Username: ` + 
    ` ${username.value} ` + 
    ` password: ` + 
    ` ${password.value}` +
    ` email: ${email.value}`);

  const error = checkForInvalidInput(username, password, password2, email)

  if (error) return;

  console.log('Preparing to send registration information...');
  
  const info = {

  }

  info.username = username.value;
  info.emailAddress = email.value;
  info.password = password.value;
 
  register(info);
  
}

const updateApiServerInfo = (info) => {

  console.log(info);
  apiServerInfo.authUrl = info.authUrl;
  apiServerInfo.regUrl = info.regUrl;
  apiServerInfo.adminUrl = info.adminUrl;
}

clearFields();
loginForm.addEventListener('submit', loginSubmitHandler);
registerForm.addEventListener('submit', registerSubmitHandler);

( async () => {
    const response = await getUserLoginUrls();
    console.log(response);
    getApiServerInfo(response);
})();
