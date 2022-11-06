'use strict';
const colors = require('colors');
const {
  getModel
} = require('../../../core/server/repository/databases/mongodb/model/model');
const { throwError } = require('../../../core/validation/validation.js');
const createRegistrySchema = require('./registry-schema');
const { log, error, getModuleLoggingMetaData } =
  require('../../../logging/logger/global-logger')(module);




const getRegistry = async () => {
  try {
    return await configRegistry();
  }
  
  catch (e) {
      error(e.stack);
      console.log(e.stack);
      throw new Error('getAppRegistry() error.  There was an error while creating the Registry'.red);
  }
};

    
const locate = async (registry, criteria) => {
  log(`Searching for `);
  criteria && log(JSON.stringify(criteria)) || throwError('Criteria cannot be null!')
  try {
    const result = await registry.findOne(criteria);
    result && log(`Located server: ${result.serverName} `, 'green');
    log(result);
    if (!result) throw Error('Could not locate server!'.red);
    return result;
  } catch (e) {
    error('Error'.red);
    log(
      `locate() error.  Error locating registry entry for server for: `
    );
    log(criteria);
    e.stack && error(e.stack);
    throw e;
  }
};
    
async function configRegistry() {
    const Registry = await getModel('registry', createRegistrySchema);
    Registry.getModuleLoggingMetaData = getModuleLoggingMetaData;
    !Registry && throwError('Missing Registry object');

    (Registry && log('Sucessfully loaded App Registry Model'.green)) || throwError('Could not load App Registry Model!');

    Registry.createEntry = async (
      name,
      ipAddress,
      port,
      endPoints,
      status,
      serverId
    ) => {
      log('<----------start of Registry.createEntry()---------->');
      log(`serverId = ${serverId}`);
      log(`ipAddress = ${ipAddress}`);
      log(`name = ${name}`);
      log(`port = ${port}`);
      log(`endPoints = ${endPoints}`);
      try {
        const result = await new Registry({
          name,
          ipAddress,
          port,
          endPoints,
          status,
          serverId
        }).save();
        result &&
          log(`Created registery entry for Server ${name}.  Info: `, 'green') &&
          log(result);
        log('<----------end of Registry.createEntry()---------->');
        return { id: result._id };
      } catch (e) {
        error(
          `createEntry() error.  Error creating registry entry for: ${name}!`
            .red
        );
        e.stack && error(e.stack); //always log error stack unmodified
        throw e;
      }
    };

    Registry.deleteEntry = async (criteria) => {
      try {
        log('<----------start of Registry.deleteEntry()---------->');
        log('Deleting any old registry entries.', 'blue');
        const result = await Registry.deleteOne({ criteria });
        log(result);
        Object.keys(result) > 0 &&
          log('Deleted old registry entry.  Info: ') &&
          log(result);
        Object.keys(result) < 1 &&
          log('No previous registration found.', 'cyan');
        log('<----------end of Registry.deleteEntry()---------->');
        return result;
      } catch (e) {
        error('deleteEntry() error.  Error deleting registry entry!'.red);
        error(e.stack); //always log error stack unmodified
        throw e;
      }
    };

    Registry.locateEntryById = async (id, available) => {
      log(`Searching for `.magenta + `'${id}'`.blue);
      const criteria = (available && { id, status: 'Available' }) || { id };
      log('Search criteria');
      log(criteria);
      return await locate(Registry, criteria);
    };

    Registry.locateEntryByName = async (serverName, available) => {
      log(`Searching for `.magenta + `'${serverName}'`.blue);
      const criteria = (available && {
        name: serverName,
        status: 'Available'
      }) || { name: serverName };
      log(`criteria = ${JSON.stringify(criteria)}.`)
      return await locate(Registry, criteria);
    };

    Registry.saveEntry = async (
      name,
      ipAddress,
      port,
      endPoints,
      status,
      id
    ) => {
      try {
        log('<----------start of Registry.saveEntry()---------->');
        log(`name = ${name}.`);
        log(`id = ${id}`);
        log(`ipAddress = ${ipAddress}.`);
        log(`port = ${port}.`);
        log(`endpoints = `) && log(endPoints);
        log(`status = ${status}.`);
        await Registry.deleteEntry(ipAddress);
        const result = await Registry.createEntry(
          name,
          ipAddress,
          port,
          endPoints,
          status,
          id
        );
        log(`${name} saved to registry.`, 'green');
        log('<----------end of Registry.saveEntry()---------->');
        return result.id;
      } catch (e) {
        error(`${name} was not saved to the registry`, 'red');
        throw e;
      }
    };

    Registry.updateEntryRequests = async (ipAddress, requests) => {
      try {
        const result = await Registry.findOne(
          { ipAddress },
          function (err, doc) {
            doc.requests = requests;
            doc.save();
            return result;
          }
        );
      } catch (e) {
        error(
          'updateRequests() error.  Error updating server requests.',
          'red'
        );
        error(e.stack);
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
        error(
          'updateStatus() error.  Error updating server status.',
          'red'
        );
        error(e.stack);
        throw e;
      }
    };
    log('App Registry Created.'.green);
    return Registry;
}
  

module.exports = { getRegistry, getModuleLoggingMetaData };
