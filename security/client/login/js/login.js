
const userContainer = document.querySelector('#user-info');
const loginForm = document.querySelector('#login-form');
const registerForm = document.querySelector('#register-form');
const messageDisplay = document.querySelector('.messages');

const DEBUG = true;

const loginPageLocation = document.location.toString();
const serverUrlAndPort = loginPageLocation.replace('/login/','');
const port = location.port;
const appRegServerIpAddress = 'http://localhost';
const appRegServerUrl = '/sneakers/app-registration-server/locate?servername';
const appRegServerPort = 4500;

let apiServerInfo = {};


const getApiServerInfo = async () => {
  const endPoint = appRegServerIpAddress + ':' + appRegServerPort + 
    appRegServerUrl.replace('servername', 'Security Api Server');
  console.log(endPoint);
  try {
    await axios.get(endPoint).then(updateApiServerInfo);
  } catch (e) {
    console.log(e.stack);
    displayMessage(SERVER_UNAVAILABLE);
  }
}


const updateApiServerInfo = (response) => {
  let apiServerName = '', apiServerPort = 0, 
      apiServerEndPoints = [], authApiUrl = '', 
      regApiUrl = '';

  const setAuthUrl = (endPoint) => authApiUrl = endPoint;
  const setRegUrl = (endPoint) => regApiUrl = endPoint;
  
  apiServerName = response.idAddress;
  apiServerPort = response.port;
  apiServerEndPoints = response.endPoints;
  
  console.log(apiServerEndPoints);

  for (endPoint of apiServerEndPoints) {
    endPoint.contains('login') && setAuthUrl(endPoint);
    endPoint.contains('register') && setRegUrl(endPoint);

  }

  return {
    apiServerName, 
    apiServerPort, 
    apiServerEndPoints, 
    authApiUrl, 
    regApiUrl
  }
}
  
const noAvailableApiServer = () => {
  return Object.keys(apiServerInfo).length === 0;
}



const login = body => {
  console.log('Posting login information.');  
  const endPoint = apiServerName + apiServerPort + authApiUrl;
  console.log(endPoint);
  axios.post(`${endPoint}`, body).then( response => {
  console.log('replacing!!')
  console.log(response.data);
  //redirect on successful login
  window.location.replace(response.data.url);
}).catch(err => {
    console.log(err);
    console.log(err);
    displayMessage(err.message);

})}

const register = async (userInfo) => {
    
  const username = userInfo.username;
  const REGISTRATION_SUCCESS = `You were successfully registered as ${username}!`;
  const endPoint = apiServerName + apiServerPort + regApiUrl;

  console.log(`register`);
  console.log(userInfo);
  console.log(endPoint)
  axios.post(`${endPoint}`, userInfo).then(response => {
    console.log(res.data); 
    const username = response.data.username;
    response.displayMessage(REGISTRATION_SUCCESS);
    
  }).catch(err => {
      console.log('We got an error.');
      console.log(err);
      displayMessage(err.response.data.trim());
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
    username: document.getElementById('#register-username'),
    email: document.getElementById('#register-email'),
    password: document.getElementById('#register-password'),
    password2: document.getElementById('#register-password-2'),
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
    const {username, password}  = getUserDataFromHtmlForm()

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
  
  if (!isValidInput(username.value, password.value)) {
    displayMessage(BAD_LOGIN);
    return;
  }

  const {username, email, password, password2} = getUserDataFromHtmlForm('Registration-Form');

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

const displayMessage = (message) => {
  console.log(`We need to display a message: ${message}.`);
  messageDisplay.classList.add('show');
  messageDisplay.textContent = message;
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
  messageDisplay.classList.remove('show');
  messageDisplay.textContent = '';
}


loginForm.addEventListener('submit', loginSubmitHandler);
registerForm.addEventListener('submit', registerSubmitHandler);
apiServerInfo = getApiServerInfo();