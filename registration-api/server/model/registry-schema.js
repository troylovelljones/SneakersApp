'use strict';

const mongoose = require('mongoose');

const createRegistrySchema = () => {
    return new mongoose.Schema({
                name: {
                    type: String, 
                    required: true
                },
                serverId: {
                    type: String,
                    required: true
                },
                ipAddress: {
                    type: String, 
                    unique: true,
                    required: true
                },
                port: {
                    type: Number,
                    required: true,
                    min: 4000,
                    max: 5000
                },
                status: String,
                requestsReceived: Number,
                createdAt: {
                    type: Date,
                    required: true,
                    immutable: true,
                    default: () => new Date()
                },
                updatedAt: {
                    type: Date,
                    required: true,
                    immutable: true,
                    default: () =>  Date.now()
                },
                endPoints: {
                    type: Array
                },
                numRequests: Number
            },
        { collection: 'registry' });
    }



module.exports = createRegistrySchema;