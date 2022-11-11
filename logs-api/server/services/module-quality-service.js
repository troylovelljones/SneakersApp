"use strict";

const qualityMetricsModel = require('../repository/model/module-quality/module-quality-metrics');

const saveModuleQualityDataToFile = async (qualityData) => {
    return 'Not Implemented Yet'

}

const saveModuleQualityDataToMongoDB = async (qualityData) => {
    await qualityMetricsModel.saveModuleQualityData(qualityData);
}

module.exports = {
    saveModuleQualityData: async (logEntries) => {
        await  saveModuleQualityDataToFile(logEntries);
        await  saveModuleQualityDataToMongoDB(logEntries);
    },
    
    getModuleQualityData: async () => {
        return await qualityMetricsModel.getModuleQualityData();
    }
}