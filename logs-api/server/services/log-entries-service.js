"use strict";

const logEntriesModel = require('../repository/model/log-entries/log-entries');

const saveLogEntriesToFile = async (logEntries) => {
    return 'Not Implemented Yet'

}

const saveLogEntriesToMongoDB = async (logEntries) => {
    await logEntriesModel.saveLogEntries(logEntries);
}

module.exports = {
    saveLogEntries: async (logEntries) => {
        await saveLogEntriesToFile(logEntries);
        await saveLogEntriesToMongoDB(logEntries);
    },
    
    getLogEntries: async () => {
        return await logEntriesModel.getLogEntries();
    }
}
