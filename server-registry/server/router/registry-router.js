const express = require(`express`);
const colors = require('colors');
const getAppRegistryController = require('../controller/registry-controller');
const router = express.Router();
const baseUrl = '/sneakers/app-registration-server';

const throwError = (message) => {
    throw new Error(message.red);
}

const getRouter = async () => {
    const appRegistryController = await getAppRegistryController();
    
    appRegistryController && 
        !console.log('Sucessfully loaded App Registry Controller'.green) ||
            throwError('Could not load App Registry Controller!');
    
    const { 
        
        healthCheck, register, locate, 
        updateStatus, updateRequests 

    } = appRegistryController;
    
    
    router.route(baseUrl + '/health').get(healthCheck);
    router.route(baseUrl + '/register').post(register);
    router.route(baseUrl + '/locate').get(locate);
    router.route(baseUrl + '/update-status').put(updateStatus);
    router.route(baseUrl + '/update-requests').put(updateRequests);
    return router;
}

module.exports = getRouter;

