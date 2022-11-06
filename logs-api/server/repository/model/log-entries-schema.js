'use strict';

const mongoose = require('mongoose');
const { Schema } = mongoose;

const createLogEntriesSchema = () => {
  const schema = new mongoose.Schema(
    {
      timestamp: {
        type: String,
        required: true,
      },
      hostIp: {
        type: String
      },
      clientIp: {
        type: String
      },
      phase: {
        type: String
      },
      logLevel : {
        type: String
      },
      module: {
        type: String
      },
      message: {
        type: String
      },
      traceId: {
        type: String
      },
      timeSinceLastLogEntry: {
        type: Schema.Types.Number
      },
      serverName: {
        type: String
      },
      createdAt: {
        type: Date,
        required: true,
        immutable: true,
        default: () => new Date()
      },
      __v: {
        type: Schema.Types.Number
      }
    }
  );

  return schema;
};

module.exports = createLogEntriesSchema;