
const userContainer = document.querySelector('#user-info');
const loginForm = document.querySelector('#login-form');
const registerForm = document.querySelector('#register-form');
const notificationWindow = document.getElementById('notification-window');

const DEBUG = true;

const loginPageLocation = document.location.toString();
const serverUrlAndPort = loginPageLocation.replace('/login/','');
const port = location.port;
const appRegServerIpAddress = 'http://localhost';
const locateUrl = '/locate?servername=%';
const appRegServerPort = 4500;
const fakeIpAddress = "http://localhost";

const apiServerInfo = {};


const getApiServerInfo = async () => {
  const allCookies = document.cookie;
  const registrationServerLink = decodeURIComponent(allCookies.
    split('; ').
    find((row) => row.startsWith('registryUrl'))?.
    split('=')[1]);
  console.log(`Registration Server link ${registrationServerLink}`);
  const endPoint = registrationServerLink + locateUrl.replace('%', 'Security Api Server');
  !endPoint && throwError('Unable to locate registry server!');
  console.log(endPoint);
  try {
    await axios.get(endPoint).then(updateApiServerInfo);
    console.log('answer received.');
    hideMessages();
    return;
  } catch (e) {
    e && console.log(e.stack);
    displayMessage(SERVER_UNAVAILABLE);
  }
}


const updateApiServerInfo = (response) => {

  console.log(response);
  const apiServerIpAddress = response.data.ipAddress;
  const apiServerPort = response.data.port;
  const apiServerEndPoints = response.data.endPoints;
  
  console.log(apiServerEndPoints);
  let authUrl = regUrl = '';
  for (const endPoint of apiServerEndPoints) {
    if (endPoint.includes('login'))
      authUrl = endPoint;
    if (endPoint.includes('register'))
      regUrl = endPoint;

  }

  console.log(authUrl, regUrl);

  apiServerInfo.ipAddress = apiServerIpAddress;
  apiServerInfo.port = apiServerPort; 
  apiServerInfo.authUrl = authUrl
  apiServerInfo.regUrl = regUrl;
 
  
}
  
const noAvailableApiServer = () => {
  return Object.keys(apiServerInfo).length === 0;
}

const displayMessage = (message) => {
  console.log(`We need to display a message: ${message}.`);
  notificationWindow.classList.add('show');
  notificationWindow.textContent = message;
  return true;

}

const login = body => {
  console.log('Posting login information.');  
  console.log(`Real ip address = ${apiServerInfo.ipAddress}.`);
  console.log(`Using fake ip address for testing: ${fakeIpAddress}.`);
  const endPoint = 
    fakeIpAddress + ':' + 
    apiServerInfo.port + 
    apiServerInfo.authUrl;
  console.log(endPoint);
  axios.post(`${endPoint}`, body).then( response => {
  console.log(response.data);
  //redirect on successful login
  window.location.replace(response.data.url);
}).catch(err => {
    console.log(err.message);
    displayMessage('There was a problem accessing the server.  Please try again.');

})}

const register = userInfo => {
    
  const username = userInfo.username;
  const emailAddress = userInfo.emailAddress
  const REGISTRATION_SUCCESS = `You were successfully registered as ${username}!`;
  console.log(`Real ip address = ${apiServerInfo.ipAddress}.`);
  console.log(`Using fake ip address for testing: ${fakeIpAddress}.`);
  const endPoint = fakeIpAddress + ':' + apiServerInfo.port + apiServerInfo.regUrl;

  console.log(`register`);
  console.log(userInfo);
  console.log(endPoint)
  axios.post(`${endPoint}`, userInfo).then(response => {
    console.log('answer');
    console.log(response.data); 
    displayMessage(REGISTRATION_SUCCESS);
    
  }).catch(err => {
      console.log('We got an error.');
      console.log(err);
      displayMessage(err.response.data);
  });
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
      //testValue(strUsername, VALID_USER) && 
      !console.log('Good username') &&
      testValue(strPassword, STRONG_PASSWORD) &&
      !console.log('Good password.') &&
      testValue(strEmail, VALID_EMAIL) &&
      !console.log('Good email.');
    
    return validInput;

}

const blankInputs = (strUsername, strPassword, strEmail) => {
  console.log(`Checking input fields for blanks...`);
  console.log(strUsername, strPassword, strEmail);
  return !(strUsername || strPassword || strEmail);
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

    let bodyObj = {
        username: username.value,
        password: password.value
    }

    console.log('Ready to log the user in.');
    login(bodyObj)

    username.value = ''
    password.value = ''
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
  
  const bodyObj = {

  }

  bodyObj.username = username.value;
  bodyObj.email = email.value;
  bodyObj.password = password.value;
 
  const result = await register(bodyObj);
  
}

const clearFields = () => {
  document.getElementById('register-username'),placeholder = 'username';
  document.getElementById('username'),placeholder = 'username';
  document.getElementById('register-email').value = '';
  document.getElementById('register-email').placeholder = 'email';
  document.getElementById('register-password').value = '';
  document.getElementById('register-password').value = 'password';
  document.getElementById('register-password-2').value = '';
  document.getElementById('register-password-2').placeholder = 'confirm password';
  document.getElementById('login-password').placeholder = 'password';
}
const clearFieldsHideErrors = () => {
  clearFields();
  hideMessages();
}

const hideMessages = () => {
  console.log('removing message window from screen.');
  notificationWindow.classList.remove('show');
  notificationWindow.textContent = '';
}

const locateServer = async (serverName) => {
  
  const allCookies = document.cookie;
  const apiServerUrl = decodeURIComponent(allCookies.
    split('; ').
    find((row) => row.startsWith('registryUrl'))?.
    split('=')[1]);

    console.log(apiServerUrl);
    try {
      const response = await axios.get(`${apiServerUrl}\locate?servername=${serverName}`, body);  
      console.log(response);
      return processRouteData(response.data) 
    } catch (e) {
        logError(e);
        e.errorLogged = true;
        showMessage('Server unavailable.  Please try to refresh the page.');
        throw e;
    }
    
}

clearFields();
loginForm.addEventListener('submit', loginSubmitHandler);
registerForm.addEventListener('submit', registerSubmitHandler);
getApiServerInfo();