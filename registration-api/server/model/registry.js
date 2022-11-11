'use strict';

require('colors');

const { getModel } = require('../../../core/server/repository/databases/mongodb/model/model');
const { throwError } = require('../../../core/validation/validation.js');
const createRegistrySchema = require('./registry-schema');
const { error, getModuleLoggingMetaData, info } = require('../../../logging/logger/global-logger')(module);

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
  info(`Searching for `);
  criteria && info(JSON.stringify(criteria)) || throwError('Criteria cannot be null!')
  try {
    const result = await registry.findOne(criteria);
    result && info(`Located server: ${result.serverName} `, 'green');
    info(`${JSON.stringify(result)}`);
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
    info('Sucessfully loaded App Registry Model'.green);

    Registry.createEntry = async (name, ipAddress, port, endPoints, status, serverId) => {
      info('<----------start of Registry.createEntry()---------->');
      info(`serverId = ${serverId}`);
      info(`ipAddress = ${ipAddress}`);
      info(`name = ${name}`);
      info(`port = ${port}`);
      info(`endPoints = ${endPoints}`);
      try {
        const result = await new Registry({name, ipAddress, port, endPoints, status,serverId}).save();
        !result && throwError('Error saving registry entry!');
        info(`Created registery entry for Server ${name}.  Info: `.green) &&
        info(`${JSON.stringify(name, null,2)}`);
        info('<----------end of Registry.createEntry()---------->');
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
        info('<----------start of Registry.deleteEntry()---------->');
        info('Deleting any old registry entries.'.blue);
        const result = await Registry.deleteOne({ criteria });
        Object.keys(result) > 0 && info('Deleted old registry entry.  Info: ') && info(`${JSON.stringify(result, null,2)}`);
        Object.keys(result) < 1 && info('No previous registration found.'.cyan);
        info('<----------end of Registry.deleteEntry()---------->');
        return result;
      } catch (e) {
          error('deleteEntry() error.  Error deleting registry entry!'.red);
          error(`${JSON.stringify(e.stack, null,2)}`); //always info error stack unmodified
          throw e;
      }
    };

    Registry.locateEntryById = async (id, available = true) => {
      info(`Searching for `.magenta + `'${id}'`.blue);
      const criteria = (available && { id, status: 'Available' }) || { id };
      info('Search criteria');
      info(`${JSON.stringify(criteria, null,2)}`);
      return await locate(Registry, criteria);
    };

    Registry.locateEntryByName = async (serverName, available = true) => {
      info(`Searching for `.magenta + `'${serverName}'`.blue);
      const criteria = (available && {
        name: serverName,
        status: 'Available'
      }) || { name: serverName };
      info(`criteria = ${JSON.stringify(criteria)}.`)
      return await locate(Registry, criteria);
    };

    Registry.saveEntry = async (name, ipAddress, port, endPoints, status, id) => {
      try {
        info('<----------start of Registry.saveEntry()---------->');
        info(`name = ${name}.`);
        info(`id = ${id}`);
        info(`ipAddress = ${ipAddress}.`);
        info(`port = ${port}.`);
        info(`endpoints = `) && info(endPoints);
        info(`status = ${status}.`);
        await Registry.deleteEntry(ipAddress);
        const result = await Registry.createEntry(name, ipAddress, port, endPoints, status, id);
        info(`${name} saved to registry.`, 'green');
        info('<----------end of Registry.saveEntry()---------->');
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
    info('App Registry Created.'.green);
    return Registry;
}
  

module.exports = { getRegistry, getModuleLoggingMetaData };
