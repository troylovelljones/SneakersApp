
"use strict";

const colors = require('colors');
const cors = require('cors');
const express = require('express');
const axios = require('axios');
const NUM_REGISTRATION_RETRIES = 4;
const TIMEOUT_MS = 1500;
const DEFAULT_PORT = 4000;
const enableDebug = true;
const baseRouter = require('./routes/base-router');

console.log('New application created!'.green);
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
    !log(`-Request Body: `) && log(request.body);
    !log(`-Response Body: `) && log(res.body);
    !log(`-Query: `) && log(req.query)
}

const middleWareLogger = (req, res, next) => {
    group(`Middleware logging commencing...`);
    log('-Time:', new Date());
    logRequestResponse(req, res);      
    groupEnd();
    log(`Middleware logging complete....`);
    groupEnd();
    next();    
}

const middleWareTracer = (req, res, next) => {
    group(`Middleware tracing commencing...`);
    const { url, path: routePath }  = req;
    log(`-Requested route: ` + `${url}`.brightBlue);
    log(`-Mapped Endpoint: ` + `${routePath}`.green);
    groupEnd();
    log(`Middleware logging complete....`);
    next();
}

const afterLogin = (name, port) => {
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

const installDefaultMiddleware = (app, options) => {
    
    app.use(express.json());
    app.use(cors);
    app.use(baseRouter); 
    options?.enableMwLogging && app.use(middleWareLogger);
    options?.enableMwTracing && app.use(middleWareTracer);
    
}

const installMiddleware = (app, middleware, alias) => {
    alias && app.use(alias, middleware) || app.use(middleware);
}

const startServer = (app, options = {}) => { 

    enableDebug && group('Server options: '.underline);
    !log('Before default options have been configured...') &&
        log(options);
    options = !options ? {} : options;

    configureDefaultOptions(options);
    
    enableDebug && 
        !log('After default options have been configured...') && 
        log(options);
    const {port, name, ipAddress} = options;

    app.appName = name;
    app.port = port;
    app.ipAddress = ipAddress;
    enableDebug && groupEnd();
    
    enableDebug && group(`Starting application ${name} at ` + `${new Date()}`.cyan);
    
    installDefaultMiddleware(app, options);
    
    app.getRoutingInformation = (display = true) => {
        display && group('-Registered routes...'.white)    
    
        const routes = [];
        app._router.stack.forEach(function (middleware){
            let route;
            display && log('Middleware'.grey.bold.underline);
            display && log(middleware);
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
            display && group(`Route path: `.white + `${route.path}`.green);
            routePathsArr.push(route.path);
            route.stack.forEach(stack => {
                display && log(`-Route function: `.white + `${stack.name}`.brightBlue);
                display && log(`-Route method: `.white + `${stack.method}`.magenta); 
          
            });
            display && groupEnd();
        });
        display && groupEnd();
        display && log('-End of registered routes'.white);
        return routePathsArr;
    }
    
    app.addARouter = (router, showRoutingInfo = true) => {
        enableDebug && log(`Adding router` + router);
        installMiddleware(app, router);
        showRoutingInfo && app.getRoutingInformation();
    
    } 
    
    app.addRouters = (...routers) => {
        enableDebug && log(...routers);
        for (const router of routers) {
            app.addARouter(router, false);
        }    
        app.getRoutingInformation();    
    }
    
    app.hostStaticFiles = (directory, alias, options = {}) => {
            
        if (!directory ) throw new Error('Missing directory!'.red); 
        alias && installMiddleware(app, express.static(directory, options), alias) || installMiddleware(app, express.static(directory, options)); 
        enableDebug && log(`Root Directory: ` + '\n' + `${directory}`.green)
        
        app.getRoutingInformation();

    } 

    app.endPoints = app.getRoutingInformation();
    app.listen(port, afterLogin(name, port));
  
    app.registerApplication = registerApplication;
    return app;
}

const processResult = (result) => {
    !result && throwError('Registration unsuccessful!');
    log(result.data.message.green);
}

let retries = 0;
const registerApplication = async (registerUrl) => {
    console.log(`Register app ${this.appName}`.blue);

    const retry = async () => {
        const result = await register(registerUrl);
        !result && 
            retries < NUM_REGISTRATION_RETRIES && 
            setTimeout(retry, TIMEOUT_MS) && 
            ++retries || processResult(result);
    }
    retry(); 
}

const register = async (registrationServerUrl) => {
    const body = {};
    body.name = this.appName;
    body.ipAddress = this.ipAddress;
    body.port = this.port;
    body.endPoints = this.endPoints;
    body.status = 'Available';
    console.log(body);
    try {
            enableDebug && log(`Registering server at ${registrationServerUrl}`.yellow);
            return await axios.post(`${registrationServerUrl}`, body);
    } catch (e) {
            log(e.stack);
            log('Error posting data to registration server!'.red);
            return false;
    }
}

module.exports = {startServer};
