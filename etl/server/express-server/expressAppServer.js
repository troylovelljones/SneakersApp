
const express = require('express');
const colors = require('colors');
const cors = require('cors');
const DEFAULT_PORT = 4000;
const DEFAULT_ROUTER_PATH = "./routes/defaultRouter"
const defaultRouter = require(DEFAULT_ROUTER_PATH);

let enableDebug = true;

const app = express();
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
group(`Starting application server at ` + `${new Date()}`.cyan);
app.use(express.json());
app.use(cors()); 

const logger = (req, res, next) => {
    group(`Middleware logging commencing...`);
    log('-Time:', new Date());
    log(`-Request Body: ` +`${req.body}`.green);
    log(`-Response Body: ` + `${res.body}`.brightBlue);
    groupEnd();
    log(`Middleware logging complete....`);
    groupEnd();
    next();    
}



//install middleware
app.use(logger);
app.use(defaultRouter); 

const showRoutingInformation = () => {
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


const afterLogin = () => {
    group(`-Application server started on port ` + `${port}`.brightGreen);
    groupEnd();
    groupEnd();
    log(`Application server started at ` + `${new Date()}.`.cyan +
        `\nReady to receive API requests.`.brightGreen);

}

const addRouter = (router, showRoutingInfo = true) => {
    app.use(router);
    showRoutingInfo && showRoutingInformation();

} 

const addRouters = (...routers) => {
    console.log(...routers);
    for (const router of routers) {
        console.log(`Adding router` + router);
        addRouter(router, false);
    }    
    showRoutingInformation();    
}

module.exports = { 
    
    startExpressApplicationServer: (options = {}) => {
        port = options.port;
        router = options.router;
        func = options.func || afterLogin;
        enableDebug = options.enableDebug || enableDebug;
        port = port || DEFAULT_PORT;
        
        app.listen(port, router, func);
        return {addRouters: (...routers) => {;
            addRouters(...routers);
        }}},
    addRouter,  
    
}    
