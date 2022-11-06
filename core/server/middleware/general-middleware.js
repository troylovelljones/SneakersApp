'use strict';

const express = require('express');
const { getRoutingInformation } = require('../app/services/app-services');
const { log } = require('../../../logging/logger/global-logger')(module);
const { throwError } = require('../../../core/validation/validation');

module.exports = {
  hostStaticFiles: (app, directory, alias, options = {}) => {
    !directory && throwError('Missing directory!'.red);
    alias && app.use(alias, express.static(directory, options)) || app.use(app, express.static(directory, options));
    log(`Root Directory: ` + '\n' + `${directory}`.green);
    //getRoutingInformation(app, options && options.displayInfo);
  },

  installDebugMiddleware: (app) => {
    app.use();
    app.use(routeTracer);
  },

  routeTracer: (req, res, next) => {
    //log(`Middleware tracing commencing...`);
    const { url, path: routePath } = req;
    log(`-Requested route: ` + `${url}`.cyan);
    log(`-Mapped Endpoint: ` + `${routePath}`.green);
    log(`Middleware logging complete....`);
    next();
  }
};
