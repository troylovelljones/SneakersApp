
"use strict";

const getAppRegistry = require('../model/registry');

const throwError = (message) => {
    throw new Error(message);
}

const getAppRegistryController = async () => {

    const AppRegistry = await getAppRegistry();
    AppRegistry && !console.log('Sucessfully loaded App Registry.'.green) ||
        throwError('Could not load App Registry!');


    return {

        healthCheck: async (req, res) => {
            console.log('Health check initiated.');
            res.status(200).send('Server OK.');
        },
        register: async (req, res) => {            
            console.log(`Registering application ${req.body.name}.`.blue);
            console.log(req.body);
            const {name, ipAddress, port, endPoints, status} = req.body;
            try {
                const id = await AppRegistry.saveEntry(name, ipAddress, port, endPoints, status);
                res.status(200).send(
                    {id, message: `Registration of ${req.body.name} successful.`});
            } catch(e) {
                console.log('Registration failed!'.red);
                e.stack && console.log(e.stack);
                res.status(400).send('Registration failed!');
            }


        },

        locate: async (req, res) => {
            console.log(req);
            const serverName = req.query.servername;
            console.log(`Locating application ${serverName}.`);
            try {
                
                const result = await AppRegistry.locateEntry(serverName);
                console.log(result);
                console.log(`Application ${serverName} found.`.green);
                res.status(200).send(result);
            } catch (e) {
                e.stack && console.log(e.stack);
                console.log('How did we end up here?');
                console.log(`Could not locate ${serverName}.`.red);
                res.status(400).send(`Could not locate ${serverName}.`);
            }
        },

        updateStatus: async (req, res) => {
            try {
                result = await AppRegistry.updateStatus(req.body.id, req.body.status);
                console.log(`Application with id: ${req.body.id} updated.`.green);
            } catch(e) {
                console.log(e.stack)
                console.log(`Could not update id: ${req.body.id}!`.red);
                res.status(400).send('Could not update record!');
            }
        },

        updateRequests: async (req, res) => {
            try {
                result = await AppRegistry.updateRequests(req.body.id, req.body.requests);
                console.log(`Application with id: ${req.body.id} updated.`.green);
            } catch(e) {
                console.log(e.stack);
                console.log(`Could not update id: ${req.body.id}!`.red);
                res.status(400).send('Could not update record!');
            }
        }

    }
}

module.exports = getAppRegistryController;