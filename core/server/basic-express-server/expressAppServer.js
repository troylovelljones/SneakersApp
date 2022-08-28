
const express = require('express');
const colors = require('colors');
const cors = require('cors');
const DEFAULT_PORT = 4000;
const DEFAULT_ROUTER_PATH = "./routes/defaultRouter"
const defaultRouter = require(DEFAULT_ROUTER_PATH);

let enableDebug = true;

console.log('New application created!'.green);
const { Console } = console;
let appConsole = new Console({colorMode: true, groupIndentation: 3,
    stdout: process.stdout, stderr: process.stderr});

appConsole = (enableDebug) ? appConsole : 
    {   clearConsole: () => {},
        log: () => {}, 
        dir: () => {},
        group: () => {},
        groupEnd: () => {}
    }  

const {group, groupEnd, log, dir } = appConsole;

//clearConsole();


const logger = (req, res, next) => {
    group(`Middleware logging commencing...`);
    log('-Time:', new Date());
    log(`-Request Body: `);
    //log(req);
    //log(`-Response Body: ` + `${res.body}`.brightBlue);
    groupEnd();
    log(`Middleware logging complete....`);
    groupEnd();
    next();    
}




const startExpressApplicationServer = (app, options = {}) => {
    
    const afterLogin = () => {
        group(`-Application server ${app.appName} started on port ` + `${app.port}`.brightGreen);
        groupEnd();
        groupEnd();
        log(`Application server started at ` + `${new Date()}.`.cyan +
            `\nReady to receive API requests.`.brightGreen);
    
    }
    
    let {port, router, func, enableDebug, name} = options;
    port = options.port;
    router = options.router;
    func = options.func || afterLogin;
    enableDebug = options.enableDebug || enableDebug;
    port = port || DEFAULT_PORT;

    app.appName = name;
    
    group(`Starting application ${name} at ` + `${new Date()}`.cyan);
    app.use(express.json());
    app.use(cors()); 
    app.use(logger);
    app.use(defaultRouter); 
    
    app.showRoutingInformation = () => {
        group('-Registered routes...'.white)    
    
        const routes = [];
        app._router.stack.forEach(function(middleware){
            let route;
    
            if(middleware.route){ // routes registered directly on the app
                routes.push(middleware.route);
            } else if(middleware.name === 'router'){ // router middleware 
                middleware.handle.stack.forEach(function(handler){
                    route = handler.route;
                    route && routes.push(route);
                });
            }
        
        });
        routes.forEach(route => {
            group(`Route path: `.white + `${route.path}`.green);
            route.stack.forEach(stack => {
               log(`-Route function: `.white + `${stack.name}`.brightBlue);
                log(`-Route method: `.white + `${stack.method}`.magenta); 
            });
            groupEnd();
        });
        groupEnd();
        log('-End of registered routes'.white);
    }
    app.addRouter = (router, showRoutingInfo = true) => {
        app.use(router);
        app.showRoutingInfo && showRoutingInformation();
    
    } 
    
    app.addRouters = (...routers) => {
        console.log(...routers);
        for (const router of routers) {
            console.log(`Adding router` + router);
            addRouter(router, false);
        }    
        showRoutingInformation();    
    }
    
    app.hostStaticFiles = (directory, alias, options = {}, showRoutingInfo = true) => {
            
        if (!directory ) throw new Error('Missing directory!'.red); 
        alias && app.use(alias, express.static(directory, options)) || app.use(express.static(directory, options)); 
        console.log(`Root Directory: ` + '\n' + `${directory}`.green)
        
        app.showRoutingInfo && showRoutingInformation();

    }

    app.showRoutingInformation();
    app.listen(port, router, func);
    app.port = port;

    return true;
}
//install middleware




module.exports = {startExpressApplicationServer};
