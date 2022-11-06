"use strict";

const logEntriesService = require('../repository/model/log-entries');

const saveLogEntriesToFile = async (logEntries) => {
    return 'Not Implemented Yet'

}

const saveLogEntriesToMongoDB = async (logEntries) => {
    await logEntriesService.saveLogEntries(logEntries);
}

module.exports = {
    saveLogEntries: async (logEntries) => {
        await saveLogEntriesToFile(logEntries);
        await saveLogEntriesToMongoDB(logEntries);
    },
    
    getLogEntries: async () => {
        return await logEntriesService.getLogEntries();
    }
}
