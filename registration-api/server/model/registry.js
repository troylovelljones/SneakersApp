'use strict';

require('colors');

const { getModel } = require('../../../core/server/repository/databases/mongodb/model/model');
const { throwError } = require('../../../core/validation/validation.js');
const createRegistrySchema = require('./registry-schema');
const { error, getModuleLoggingMetaData, debug } = require('../../../logging/logger/global-logger')(module);

const getRegistry = async () => {
  try {
    return await configRegistry();
  }
  catch (e) {
    error('getAppRegistry() error.  There was an error while creating the Registry'.red);
    error(e && `${JSON.stringify(e.stack, null, 2)}`);
    throw e
  }
};
    
const locate = async (registry, criteria) => {
  debug(`Searching for `);
  criteria && debug(JSON.stringify(criteria)) || throwError('Criteria cannot be null!')
  try {
    const result = await registry.findOne(criteria);
    result && debug(`Located server: ${result.serverName} `, 'green');
    debug(`${JSON.stringify(result)}`);
    !result && throwError('Could not locate server!'.red);
    return result;
  } catch (e) {
      error(`locate() error.  Error locating registry entry for server for: `);
      error(`${JSON.stringify(criteria, null, 2)}`);
      e.stack && error(`${JSON.stringify(e.stack, null, 2)}`);
      throw e;
  }
};
    
async function configRegistry() {
    const Registry = await getModel('registry', createRegistrySchema);
    Registry.getModuleLoggingMetaData = getModuleLoggingMetaData;
    !Registry && throwError('Missing Registry object');
    debug('Sucessfully loaded App Registry Model'.green);

    Registry.createEntry = async (name, ipAddress, port, endPoints, status, serverId) => {
      debug('<----------start of Registry.createEntry()---------->');
      debug(`serverId = ${serverId}`);
      debug(`ipAddress = ${ipAddress}`);
      debug(`name = ${name}`);
      debug(`port = ${port}`);
      debug(`endPoints = ${endPoints}`);
      try {
        const result = await new Registry({name, ipAddress, port, endPoints, status,serverId}).save();
        !result && throwError('Error saving registry entry!');
        debug(`Created registery entry for Server ${name}.  Info: `.green) &&
        debug(`${JSON.stringify(name, null,2)}`);
        debug('<----------end of Registry.createEntry()---------->');
        return { id: result._id };
      } catch (e) {
          error(`createEntry() error.  Error creating registry entry for: ${name}!`);
          e && error(e);
          e.stack && error(e.stack);
          throw e;
      }
    };

    Registry.deleteEntry = async (criteria) => {
      try {
        debug('<----------start of Registry.deleteEntry()---------->');
        debug('Deleting any old registry entries.'.blue);
        const result = await Registry.deleteOne({ criteria });
        Object.keys(result) > 0 && debug('Deleted old registry entry.  info: ') && debug(`${JSON.stringify(result, null,2)}`);
        Object.keys(result) < 1 && info('No previous registration found.'.cyan);
        debug('<----------end of Registry.deleteEntry()---------->');
        return result;
      } catch (e) {
          error('deleteEntry() error.  Error deleting registry entry!'.red);
          error(`${JSON.stringify(e.stack, null,2)}`); //always info error stack unmodified
          throw e;
      }
    };

    Registry.locateEntryById = async (id, available = true) => {
      debug(`Searching for `.magenta + `'${id}'`.blue);
      const criteria = (available && { id, status: 'Available' }) || { id };
      debug('Search criteria');
      debug(`${JSON.stringify(criteria, null,2)}`);
      return await locate(Registry, criteria);
    };

    Registry.locateEntryByName = async (serverName, available = true) => {
      debug(`Searching for `.magenta + `'${serverName}'`.blue);
      const criteria = (available && {
        name: serverName,
        status: 'Available'
      }) || { name: serverName };
      debug(`criteria = ${JSON.stringify(criteria)}.`)
      return await locate(Registry, criteria);
    };

    Registry.saveEntry = async (name, ipAddress, port, endPoints, status, id) => {
      try {
        debug('<----------start of Registry.saveEntry()---------->');
        debug(`name = ${name}.`);
        debug(`id = ${id}`);
        debug(`ipAddress = ${ipAddress}.`);
        debug(`port = ${port}.`);
        debug(`endpoints = `) && debug(endPoints);
        debug(`status = ${status}.`);
        await Registry.deleteEntry(ipAddress);
        const result = await Registry.createEntry(name, ipAddress, port, endPoints, status, id);
        debug(`${name} saved to registry.`, 'green');
        debug('<----------end of Registry.saveEntry()---------->');
        return result.id;
      } catch (e) {
        error(`${name} was not saved to the registry`, 'red');
        throw e;
      }
    };

    Registry.updateEntryRequests = async (ipAddress, requests) => {
      try {
        const result = await Registry.findOne({ ipAddress },
          function (err, doc) {
            doc.requests = requests;
            doc.save();
            return result;
          }
        );
      } catch (e) {
          error('updateRequests() error.  Error updating server requests.');
          error(`${JSON.stringify(e.stack, null,2)}`);
          throw e;
      }
    };

    Registry.updateEntryStatus = async (ipAddress, status) => {
      try {
        const result = await Registry.findOne(
          { ipAddress },
          function (err, doc) {
            doc.status = status;
            doc.save();
            return result;
          }
        );
      } catch (e) {
          error('updateStatus() error.  Error updating server status.');
          error(`${JSON.stringify(e.stack, null,2)}`);
          throw e;
      }
    };
    debug('App Registry Created.'.green);
    return Registry;
}
  

module.exports = { getRegistry, getModuleLoggingMetaData };
