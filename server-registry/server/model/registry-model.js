"use strict";

const mongoose = require('mongoose');
const colors = require('colors');
const output = require('dotenv').config();
const MONGO_DB = process.env.MONGO_DB;

const throwError = (message) => {
    throw new Error(message.red);
}

output?.error && throwError(output.error.message);

!MONGO_DB && throwError('Missing Database!');

const getAppRegistryModel = async () =>  {
    try {
        const db = await dbConnect();
        return createModel();
    } catch(e) {
        console.log(e.stack);
        throw new Error('Could not connect to Mongo DB!'.red);

    }
};


const dbConnect = async () => {

    try {
        const db = await mongoose.connect(MONGO_DB);
        db && console.log('Connected to Sneakers database.'.green);
        return db || throwError('Could not connect to the Sneakers database!');
    } catch (e) {
        console.log(e.stack);
        throw e;
    }
    
    

}

const createSchema = () => {
    return new mongoose.Schema({
                name: String, 
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
            {
                methods: {
                    findServerByName(sn) {
                        return mongoose.model('AppRegistration').find({appName: this.appName}, sn);
                    }
                }
            }

        )};

const createModel = () => {
    
    let registryModel;
    for (const modelName of mongoose.modelNames())
        if (modelName === 'AppRegistry')
            registryModel = mongoose.model('AppRegistration');
    console.log('Created AppRegistration model.'.green);
    return  registryModel ? registryModel : mongoose.model('AppRegistration', createSchema()); 

}

module.exports = getAppRegistryModel;





