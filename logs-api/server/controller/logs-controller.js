"use strict";

const moduleQualityService = require('../services/module-quality-service');
const logEntriesService = require('../services/log-entries-service');
const { info, error } = require('../../../logging/logger/global-logger')(module);


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
            error(JSON.stringify(err.stack, null, 2));
            !res.headersSent && res.status(500).send('Error saving logs.');
        });
    },

    saveModuleQualityMetrices: (req, res) => {
        //don't use await here
        info('QUALITY METRICS DATA'.blue);
        info(req.body);
        moduleQualityService.saveModuleQualityData(req.body).then (() => {
            res.status(200).send('Metrics saved.');
        }).catch(err => {
            e && error(e);
            e.stack && error(err.stack);
            !res.headersSent && res.status(500).send('Error saving metrics');
        })
        
    }

    
}

