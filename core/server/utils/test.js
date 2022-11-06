"use strict";

const os = require('os');

//const { getModuleName } = require("./extended-app-utils");
//const HOST_IP = require('./host-ip');

/*const os = require('os');
require('../utils/host-ip');
const { getDpendencies } = require('./app-utils');
const authController = require('../../../authentication-api/server/authentication-api');
const iface = Object.keys(os.networkInterfaces()).filter(iface => iface.startsWith('en'))[0];
const ipAddress = os.networkInterfaces()[iface].filter(item => item.netmask ==='255.255.255.0')[0].address;

const POLL_INTERVAL = 500; //500 milliseconds
const waitFor = async (duration) => {
    console.log('Waiting...');                                       
    await new Promise(r => setTimeout(r, duration));
}
const waitForSignal = async (object) => {
    while(true) {
        console.log('Waiting...');  
        if (object.signal) return;
        else await waitFor(POLL_INTERVAL);
    }
}*/

/*const moduleName = '/blah/one/two/three';
console.log(getModuleName(moduleName));*/

/*const { getDependencies } = require('./app-utils');
const authController = require('../../../authentication-api/server/controller/authentication-controller');

const dp = new Set();
const dependencies = getDependencies(authController);
console.log(dependencies);

//console.log(authController);*/


const ip = (() => {
    const iface = Object.keys(os.networkInterfaces()).filter(iface => iface.startsWith('en'))[0];
    return os.networkInterfaces()[iface].filter(item => item.netmask.startsWith('255'))[0].address})();
console.log(ip);

/*
module.children.map(child => { return {name: child.filename, exports: child.exports} }).forEach(module => console.log(`${module.name} => ${module.exports}`));
const test = {signal: null};
(async () => {
    let start = new Date().getSeconds();
    setTimeout(() => { test.signal = true}, 3000);
    await waitForSignal(test);
    console.log('Done');
    start = new Date().getSeconds();
    console.log(`Function waited for ${(new Date().getSeconds() - start)} seconds`);
    await waitFor(3000);
    console.log(`Function waited for ${(new Date().getSeconds() - start)} seconds`);

})();

module.children.map(child => console.log(child.name));
module.children.map(child => { return {name: child.filename, exports: child.exports} }).forEach(module => console.log(`${module.name} => ${module.exports}`));






//updateCfgFile('SECRET_KEY','12345', './.cfg');*/