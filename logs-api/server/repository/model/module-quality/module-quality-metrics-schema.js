"use strict"
const mongoose = require('mongoose');
const { Schema } = mongoose;

const createModueQualitySchema = () => {
    const moduleQualityMetricsSchema = new mongoose.Schema(
        {
            module: {
                type: String,
                required: true,
                immutable: true
            },
            errorCount: {
                type: Schema.Types.Number,
                required: true,
                immutable: true
            },
            warningCount: {
                type: Schema.Types.Number,
                required: true,
                immutable: true
            }
        }
    );
    const moduleQualitySchema = new mongoose.Schema(
      {

        serverName: {
            type: String,
            required: true,
            immutable: true
          },
        ipAddress: {
            type: String,
            required: true,
            immutable: true
        },
        requestCount: {
            type: Schema.Types.Number,
            required: true
        },
        date: {
            type: Date,
            required: true,
            immutable: true,
        },
        moduleQualityMetrics: [moduleQualityMetricsSchema],
        __v: {
            type: Schema.Types.Number
          }
    });

    return moduleQualitySchema;
}

module.exports = createModueQualitySchema;
