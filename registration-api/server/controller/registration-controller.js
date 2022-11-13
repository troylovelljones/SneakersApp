'use strict';
const env = require('dotenv').config();

const { getModuleDependencies } = require('../../../core/server/utils/app-utils');
const { getRegistry } = require('../model/registry');
const HOST_IP_ADDRESS = require('../../../core/server/utils/host-ip');
const { throwError } = require('../../../core/validation/validation.js');
const { debug, error, getModuleLoggingMetaData } = require('../../../logging/logger/global-logger')(module);
const registrationServices = require('../services/registration-services');
const { updateModuleLoggingMetaData } = require('../../../logging/logger/logger-manager');
const dependencies = Array.from(getModuleDependencies(module));

module.getModuleLoggingMetaData = getModuleLoggingMetaData;
module.getDependencies = () => dependencies;
env.error && throwError(env.error);

debug('Environment variables.');
debug(JSON.stringify(env, null, 2));

const logServerRequest = (req) => {
  debug('<-------------------REQUEST RECIEVED-------------------->'.cyan);
  debug('<----------Start register() on Registry Server---------->'.blue);
  debug(`Registering application ${req.body.name}.`.blue);
  debug(`With parameters = `);
  debug(req.body);
  debug('Logging configuration');
  debug(JSON.stringify(getModuleLoggingMetaData()));
  debug(`Client ip address: ${req.ip.split('::ffff:')[1]}`);
} 

const logResponse = (data) => {
  debug(`${data.serverId || data.username} registered!`);
  debug('<--------END register() ON REGISTRY SERVER Server----->'.blue);
  debug('<-------------------RESPONSE SENT---------------------->');
  debug('Resetting clientIp and phase logging metadata');
}

const logUserRequest = (req) => {
  debug('<-------------------REQUEST RECIEVED-------------------->'.cyan);
  debug('<----------Start register() on Registry Server---------->'.blue);
  debug(`Registering user ${req.body.username}.`.blue);
  debug(`With parameters = `);
  debug(req.body);
  debug('Logging configuration');
  debug(JSON.stringify(getModuleLoggingMetaData()));
  debug(`Client ip address: ${req.ip.split('::ffff:')[1]}`);
}

const getController = async () => {
  const Registry = await getRegistry();
  Registry && debug('Sucessfully loaded App Registry');
  if (!Registry) throwError('Error: ~24, Could not load App Registry!');
  return {
    locate: async (req, res) => {
      debug('<-------------------REQUEST RECIEVED-------------------->');
      debug('<----------Start locate() on Registry Server---------->');
      const serverName = req.query.servername;
      const available = req.query.available || req.query.available === undefined;  //default to searching for avaiable servers
      debug(`Locating application ${serverName}.`);
      try {
        const server = await Registry.locateEntryByName(serverName, available);
        debug(JSON.stringify(server));
        debug(`Application ${serverName} found.`.green);
        res.status(200).send(server);
        debug ('<-------------------RESPONSE SENT----------------------->');
        debug('<-------------END locate() on Registry Server------------>');
      } catch (e) {
          error(e);
          error(e.stack);
          error(`Could not locate ${serverName}.`);
          !res.headersSent && res.status(400).send(`Could not locate ${serverName}.`);
      }
    },

    registerServer: async (req, res) => {
      try {
        const clientIp = req.ip.split('::ffff:')[1];
        const traceId = req.traceId;
        const phase = clientIp !== HOST_IP_ADDRESS ? 'startup' : 'ready';
        updateModuleLoggingMetaData(module, {clientIp, traceId, phase});
        logServerRequest(req);
        const { serverId } = req.body;
        !serverId && debug('Server Id is missing') && throwError();
        const { status, message, _id } = await registrationServices.registerServer(req.body);
        const data = { serverId };
        logResponse(data);
        updateModuleLoggingMetaData(module, {clientId: null, phase: 'ready'});
        return res.status(status).send({ message, _id});
      }
      catch (e) {
        error('Registration failed!');
        e.stack && error(e.stack);
        !res.headersSent && res.status(400).send('Registration failed!');
      }
    },

    registerUser: async (req, res) => {
      try {
        const clientIp = req.ip.split('::ffff:')[1];
        const traceId = req.traceId;
        const phase = clientIp !== HOST_IP_ADDRESS ? 'startup' : 'ready';
        updateModuleLoggingMetaData(module, {clientIp, traceId, phase});
        logUserRequest(req);
        const { username, password, emailAddress } = req.body;
        const { status, message, userId } = await registerUser(username, password, emailAddress);
        const data = {username};
        logResponse(data);
        updateModuleLoggingMetaData(module, {clientId: null, phase: 'ready'});
        res.status(status).send({ userId, message});
      } catch (e) {
          error('Registration failed!');
          e.stack && error(e.stack);
          !res.headersSent && res.status(400).send('Registration failed!');
      }
    },

    update: async (req, res) => {
      try {
        debug('Request = ', module.moduleLoggingMetaData);
        debug(req.body, module.moduleLoggingMetaData);
        debug(req.body.id, module.moduleLoggingMetaData);
        let result =
          req.body.status &&
          (await Registry.updateEntryStatus(req.body.id, req.body.status));
        result =
          req.body.requests &&
          (await Registry.updateEntryRequests(req.body.id, req.body.requests));
        debug(`Application with id: ${req.body.id} updated.`.green);
        res.status(200).send(result);
      } catch (e) {
        error(e.stack);
        error(`Could not update id: ${req.body.id}!`.red);
        res.status(400).send('Could not update record!');
      }
    }
  };
};

module.exports = { getController, getModuleLoggingMetaData };
