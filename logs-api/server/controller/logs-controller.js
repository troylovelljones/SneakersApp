"use strict";

const moduleQualityService = require('../services/module-quality-service');
const logEntriesService = require('../services/log-entries-service');
const { debug, error } = require('../../../logging/logger/global-logger')(module);


module.exports = {

    getLogEntries: (req, res) => {
        //don't use await here
        logEntriesService.getLogs().then((logs)=> {
            res.status(200).send(logs);
        }).catch(err => {
            error(JSON.stringify(err));
            !res.headerSent && res.status(500).send('Error retrieving logs.');
        })
    },

    getModuleQualityMetrics: (req, res) => {
        //don't use await here
        moduleQualityService.getModuleQualityData().then((metrics)=> {
            res.status(200).send(metrics);
        }).catch(err => {
            error(JSON.stringify(err));
            !res.headerSent && res.status(500).send('Error retrieving metrics.');
        })
    },

    saveLogEntries: (req, res) => {
        //don't use await here

        logEntriesService.saveLogEntries(req.body).then( () => {
            res.status(200).send('Logs saved.');
        }).catch(err => {
            error(err.stack);
            !res.headersSent && res.status(500).send('Error saving logs.');
        });
    },

    saveModuleQualityMetrices: (req, res) => {
        //don't use await here
        debug('Quality Metrics Data'.blue);
        debug(req.body);
        moduleQualityService.saveModuleQualityData(req.body).then (() => {
            res.status(200).send('Metrics saved.');
        }).catch(err => {
            error(req.body);
            error(err);
            !res.headersSent && res.status(500).send('Error saving metrics');
        })
        
    }

    
}

