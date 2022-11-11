"use strict";
const { getModel } = require('../../../../../core/server/repository/databases/mongodb/model/model');
const createLogEntriesSchema = require('./log-entries-schema');
let LogEntries;

const saveLogEntries = async(logEntries) => {
  LogEntries = LogEntries || await getModel('server_log_entries', createLogEntriesSchema);
  return await LogEntries.insertMany(logEntries);
}

const getLogEntries = async() => {
  LogEntries = LogEntries || await getModel('server_log_entries', createLogEntriesSchema);
  return await LogEntries.getAll();
}

module.exports = {
  saveLogEntries,
  getLogEntries
}

