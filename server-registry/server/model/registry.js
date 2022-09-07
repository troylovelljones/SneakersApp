const getAppRegistryModel = require('./registry-model');
const colors = require('colors');
const e = require('express');

const logToConsole = (message, color) => {
   typeof message === 'string' ? console.log(color && message[color] || 
        message.white) :  console.log(message);
    return true;
}

const throwError = (message) => {
    throw new Error(message.red);
}

const getAppRegistry = async () => {
    try {
        var AppRegistry = await getAppRegistryModel();
        
        AppRegistry && logToConsole('Sucessfully loaded App Registry Model'.green) ||
            throwError('Could not load App Registry Model!');

        
        AppRegistry.deleteEntry = async (name, ipAddress, port) => {
            try {
                logToConsole('Deleting any old registry entries.', 'blue');
                const result = await AppRegistry.deleteOne({name, ipAddress, port});
                console.log(result);
                result && 
                logToConsole('Deleted old registry entry.  Info: ') && 
                logToConsole(result) || logToConsole('No previous registration found.', 'cyan');
                return result;
            } catch (e) {
                logToConsole('deleteEntry() error.  Error deleting registry entry!'.red);
                console.log(e.stack); //always log error stack unmodified
                throw e;
            }
        
        }   

        AppRegistry.createEntry = async (name, ipAddress, port, endPoints, status) => { 
            try {
                const result =  await new AppRegistry({name,
                    ipAddress, 
                    port,
                    endPoints,
                    status}).save();
                    result && 
                    logToConsole(`Registered Server ${name}.  Info: `, 'green') && 
                    logToConsole(result);
                    return result._id;
            } catch (e) {
                logToConsole(`createEntry() error.  Error registering server: ${name}!`,'red');
                console.log(e.stack); //always log error stack unmodified
                throw e;

            }
            
        }   

        AppRegistry.saveEntry = async (name, ipAddress, port, endPoints, status) => {
            try {
                await AppRegistry.deleteEntry(name, ipAddress, port);
                const result = await AppRegistry.createEntry(name, ipAddress, port, endPoints, status);
                logToConsole(`${name} saved to registry.`,'green');
                return result.id;
            } catch {e} {
                logToConsole(`${name} was not saved to the registry`,'red');
                throw e;
            }
        
        }   

        AppRegistry.locateEntry = async (serverName) => {
            console.log(`Searching for `.magenta +`'${serverName}'`.blue);
            try {
                const result = await AppRegistry.findOne({name: serverName, status: 'Available'});
                result && console.log(`Located server: ${serverName} `.green);
                if (!result) throw Error('Could not locate server!'.red)
                return result;
            } catch (e) {
                logToConsole(`locateEntry() error.  Error locating registry entry for server ${serverName}.`,'red');
                console.log(e.stack);
                throw e;
            }  

        }   

        AppRegistry.updateStatus = async (id, status) => {
            try {
                const result = await AppRegistry.findOne({ _id: id }, function (err, doc) {
                    doc.status = status;
                    doc.save();
                    return result;
                });
            } catch (e) {
                logToConsole('updateStatus() error.  Error updating server status.','red');
                console.log(e.stack);
                throw e;
            }
           
        }   

        AppRegistry.updateRequests = async (id, requests) => {
            try {
                const result = await AppRegistry.findOne({ _id: id }, function (err, doc) {
                doc.requests = requests;
                doc.save();
                return result;
                });
            } catch (e) {
                logToConsole('updateRequests() error.  Error updating server requests.','red');
                console.log(e.stack);
                throw e;
            }
           
        }
        console.log('App Registry Created.'.green);
        return AppRegistry;

    } catch(e) {
        console.log(e.stack);
        throw new Error('getAppRegistryError().  There was an error while creating the App Registry'.red);
    }

}

module.exports = getAppRegistry;
  