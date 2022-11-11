"use strict";
const { getModel } = require('../../../../../core/server/repository/databases/mongodb/model/model');
const createModuleQualitySchema = require('./module-quality-metrics-schema');
let ModuleQualityData;

const saveModuleQualityData = async(moduleQualityData) => {
    ModuleQualityData = ModuleQualityData || await getModel('server_health_data', createModuleQualitySchema);
    return await ModuleQualityData.insertMany(moduleQualityData);
}

const getModuleQualityData = async() => {
    ModuleQualityData = ModuleQualityData || await getModel('server_health_data', createModuleQualitySchema);
    return await ModuleQualityData.getAll();
}

module.exports = {
    saveModuleQualityData,
    getModuleQualityData
}