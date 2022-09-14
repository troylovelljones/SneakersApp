//"use strict";

const colors = require('colors');
const cors = require('cors');
const express = require('express');
const axios = require('axios');
const registrationServerUpdate = require('./controllers/registration-server-update');


//environment variables
const TIMEOUT_MS = 1500;
const NUM_REGISTRATION_RETRIES = 4;
const DEFAULT_PORT = 4000;
const enableDebug = true;
let registrationServerUrl = '';

const { Console } = console;

const appConsole = enableDebug ? new Console({colorMode: true, groupIndentation: 3,
    stdout: process.stdout, 
    stderr: process.stderr}) : 
        {   
            clearConsole: () => {},
            log: () => {}, 
            group: () => {},
            groupEnd: () => {}
        }  

const {group, groupEnd, log} = appConsole;

const throwError = (message) => {
    throw new Error(message.red);
}

const logRequestResponse = (req, res) => {
    log(`-Request Body: `)
    log(req.body);
    log(`-Response Body: `);
    log(res.body);
    log(`-Query: `) && log(req.query)
}

const RequestResponseLogger = (req, res, next) => {
    group(`Middleware logging commencing...`);
    log('-Time:', new Date());
    logRequestResponse(req, res);      
    groupEnd();
    log(`Middleware logging complete....`);
    groupEnd();
    next();    
}

const routeTracer = (req, res, next) => {
    group(`Middleware tracing commencing...`);
    const { url, path: routePath }  = req;
    log(`-Requested route: ` + `${url}`.cyan);
    log(`-Mapped Endpoint: ` + `${routePath}`.green);
    groupEnd();
    log(`Middleware logging complete....`);
    next();
}

const loginSuccess = (name, port) => {
    return () => {
        group(`-Application server ${name} started on port ` + `${port}`.brightGreen);
        groupEnd();
        groupEnd();
        log(`Application server started at ` + `${new Date()}.`.cyan +
        `\nReady to receive API requests.`.brightGreen);
    }

}

const configureDefaultOptions = (options) => {
    const func = options?.func || afterLogin;
    options.func = func;
    const debug = options?.enableDebug || enableDebug;
    options.enableDebug = debug;
    const port = options?.port || DEFAULT_PORT;
    options.port = port;
}

const installDebugMiddleware = (app) => {
    app.use(RequestResponseLogger);
    app.use(routeTracer);
    
}

const getRoutingInformation = (app, displayInfo = true) => {
    displayInfo && group('-Registered routes...'.white)    
    const routes = [];
    app._router.stack.forEach(function (middleware){
        let route;
        displayInfo && log('Middleware'.grey.bold.underline);
        displayInfo && log(middleware);
        if (middleware.route){ // routes registered directly on the app
            routes.push(middleware.route);
        } else if (middleware.name === 'router'){ // router middleware 
            middleware.handle.stack.forEach(function(handler){
                route = handler.route;
                route && routes.push(route);
            });
        }
    
    });
    const routePathsArr = [];
    routes.forEach(route => {
        displayInfo && group(`Route path: `.white + `${route.path}`.green);
        routePathsArr.push(route.path);
        route.stack.forEach(stack => {
            displayInfo && log(`-Route function: `.white + `${stack.name}`.brightBlue);
            displayInfo && log(`-Route method: `.white + `${stack.method}`.magenta); 
        });
        displayInfo && groupEnd();
    });
    displayInfo && groupEnd();
    displayInfo && log('-End of registered routes'.white);
    return routePathsArr;
}

let retries = 0;
function registerServer (app, options) {
    log(`Register app ${options.name}`.blue);
    //need to get the latest endpoints before registration
    options.endPoints = getRoutingInformation(app);
    const retry = async () => {
        const result = await register(options);
        !result && ++retries < NUM_REGISTRATION_RETRIES ?
            setTimeout(retry, TIMEOUT_MS) : processResult(result);
    }
    retry(); 
}

async function register(options) {
    const body = {};
    body.name = options.name
    body.ipAddress = options.ipAddress
    body.port = options.port
    body.endPoints = options.endPoints;
    body.status = 'Available';
    log(body);
    try {
        enableDebug && log(`-Registering server at ${registrationServerUrl}`.yellow);
        const result = await axios.post(`${options.registrationServerUrl}`, body);
        registrationServerUrl = options.registrationServerUrl.replace('/register','');
        return result;

    } catch (e) {
        e.stack && log(e.stack);
        log('Error posting data to registration server!'.red);
        return false;
    }
}

function processResult (result) {
    !result && throwError('Registration unsuccessful!');
    log(result.data.message.green);
}

function hostStaticFiles(app, directory, alias, options = {}) {            
    if (!directory ) throw new Error('Missing directory!'.red); 
        alias && 
        app.use(alias, express.static(directory, options)) || 
        app.use(app, express.static(directory, options)); 
    enableDebug && log(`Root Directory: ` + '\n' + `${directory}`.green)
    getRoutingInformation(app);       
} 

const getRegistrationServerUrl = () =>  {
    return registrationServerUrl;
}

const updateRegistrationServerUrl = (update) => {
    registrationServerUrl = update.url;
}

registrationServerUpdate.on('server-url', updateRegistrationServerUrl);

module.exports = {
    registerServer, hostStaticFiles, installDebugMiddleware, 
    configureDefaultOptions, loginSuccess, 
    throwError, getRegistrationServerUrl
};


