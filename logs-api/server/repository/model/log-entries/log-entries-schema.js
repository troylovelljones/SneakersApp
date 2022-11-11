'use strict';

const mongoose = require('mongoose');
const { Schema } = mongoose;

const createLogEntriesSchema = () => {
  const schema = new mongoose.Schema(
    {
      timestamp: {
        type: Date,
        required: true,
        immutable: true
      },
      hostIp: {
        type: String,
        required: true,
        immutable: true
      },
      clientIp: {
        type: String,
        immutable: true
      },
      phase: {
        type: String,
        required: true,
        immutable: true
      },
      level : {
        type: String,
        required: true,
        immutable: true
      },
      module: {
        type: String,
        required: true,
        immutable: true
      },
      message: {
        type: String,
        required: true,
        immutable: true
      },
      traceId: {
        type: String,
        immutable: true
      },
      timeSinceLastLogEntry: {
        type: Schema.Types.Number
      },
      serverName: {
        type: String,
        required: true,
        immutable: true
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