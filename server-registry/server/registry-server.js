
const getRouter = require('./router/registry-router');
const cors = require('cors');
const colors = require("colors");
const output = require('dotenv').config();
const express = require('express');
const axios = require('axios');
const app = express();


//environment variables
const PORT = process.env.PORT || 4500;
const APP_NAME =  process.env.APP_NAME || 'App Registration Server';
const SERVER_IP_ADDRESS =  process.env.SERVER_IP_ADDRESS;
const fakeIpAddress = 'http://localhost';
const registrationServerUrl = fakeIpAddress + ':' + PORT + '/sneakers/app-registration-server/register';

const TIMEOUT_MS = 2000;
const NUM_REGISTRATION_RETRIES = 4;

const throwError = (message) => {
    throw new Error(message.red);
}

output.error && !console.log(output) && throwError(output.error);



const afterLogin = () => console.log(`Server up on port ${PORT}`.green);

console.log('Launching server.'.blue);

const processResult = (result) => {
    !result && throwError('Registration unsuccessful!');
    console.log('Registration successful.'.green);
   
}

let retries = 0;

const registerApplication = async () => {
    const retryRegistration = async () => {
        const result = await register(registrationServerUrl);
        !result && 
        retries < NUM_REGISTRATION_RETRIES && 
        setTimeout(retryRegistration, TIMEOUT_MS) && 
        ++retries || processResult(result);
    }
    
    try {
        await retryRegistration();
    } catch (e) {
        throwError('retryRegistration() error.');
    }
    
    
}

const register = async (registrationServerUrl) => {
    const body = {};
    body.name = APP_NAME;
    body.ipAddress = SERVER_IP_ADDRESS;
    body.port = PORT
    body.endPoints = app.getRoutingInformation();
    body.status = 'Available';
    try {
            console.log(`Registering server at ${registrationServerUrl}`.magenta);
            return await axios.post(`${registrationServerUrl}`, body);
    } catch (e) {
            e.stack && console.log(e.stack);
            console.log('register() error.  Could not post data to registration server!'.red);
            return false;
    }
}

(async() => {
    app.use(express.json());
    app.use(cors());
    const router = await getRouter();
    router && 
        !console.log('Routes retrieved.'.green) ||
            throwError('Routes were not retrieved!')

    app.use(router);
    app.getRoutingInformation = () => { 

        const routes = [];
        app._router.stack.forEach(function (middleware){
            if (middleware.route){ // routes registered directly on the app
                routes.push(middleware.route);
            } else if (middleware.name === 'router'){ // router middleware 
                middleware.handle.stack.forEach(function(handler){
                    const route = handler.route;
                    route && routes.push(route);
                });
            }
        
        });
        const routePathsArr = [];
        routes.forEach(route => {
            console.log(`Route path: `.white + `${route.path}`.green);
            routePathsArr.push(route.path);
           
        });
        return routePathsArr;
    }
    app.listen(PORT, afterLogin);
    registerApplication();
})();








