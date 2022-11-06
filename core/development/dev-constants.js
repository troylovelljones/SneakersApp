"use strict"


const AUTH_URL = 'http://localhost:4900/authentication-api-server/';

module.exports = {
  
     ACCESS_TOKEN_DURATION: '1m',
     AUTH_SERVER_URL: 'authenticate/server',
     AUTH_TOKEN_URL: AUTH_URL + '/authenticate/token',
     AUTH_URL,
     AUTH_USER_URL: 'authenticate/user',
     FIFTEEN_MINUTES: 900000,
     LOGIN_LINK: '/login',
     MAX_REGISTRATION_RETRIES: 9,
     POLL_INTERVAL: 500,
     PROTOCOL: 'http',
     randomIpTuple: () => ('.' + Math.ceil(Math.random() * 255)),
     REGISTRATION_SERVER_URL: 'http://localhost:4500/registration-api-server',
     REGISTRATION_URL: 'http://localhost:4500/registration-api-server',
     RETRY_DURATION: 3000,
     REGISTER_SERVER_URL: '/register/server',
     REGISTER_USER_URL: '/register/user',
     REFRESH_TOKEN_DURATION: '1d',
     REFRESH_TOKEN_URL: 'refreshToken?token=%TOKEN&type=%TYPE&id=%ID', 
     SKIP_AUTHORIZATION: true,
     TIMEOUT: 5000, 
    
}

