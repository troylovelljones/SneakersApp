"use strict";

const logEntriesService = require('../service/logs-service');
const { log, error } = require('../../../logging/logger/global-logger')(module);


module.exports = {

    saveLogEntries: (req, res) => {
        //cannot use await here
        logEntriesService.saveLogEntries(req.body).then( () => {
            console.log(req.body);
            res.status(200).send('Logs saved.');
        }).catch(err => {
            error(JSON.stringify(err.stack, null, 2));
            !res.headersSent && res.status(500).send('Error saving logs.');
        });
    },

    getLogEntries: (req, res) => {
        //cannot use await here
        logEntriesService.getLogs().then((logs)=> {
            res.status(200).send(logs);
        }).catch(err => {
            error(JSON.stringify(err));
            !res.headerSent && res.status(500).send('Error retrieving logs.');
        })
    }
}
