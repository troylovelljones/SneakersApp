'use strict';

const os = require('os');
const devConstants = require('../../development/dev-constants');
const POLL_INTERVAL = devConstants.POLL_INTERVAL;
const { getModuleName } = require('./extended-app-utils');

//logging setup
const { info, getModuleLoggingMetaData, warn } = require('../../../logging/logger/global-logger')(module);
const getHostName = () => {
  return os.hostname();
};

const getDependencies = (targetModule, dependencies) => {
    warn('Dependencies evaluated = '.white);
    warn(dependencies);
  //base condition - recurse until the nmodule parameter has no children
  if ((targetModule && targetModule.children.length < 1) || 
    (dependencies.has(targetModule) && !console.info('Duplicate: ' + getModuleName(targetModule.filename)))) {
    return dependencies;
  }
  for (const target of targetModule.children) {
    if (target.filename.includes('node') || 
      dependencies.has(target.filename) && 
      warn(`Dependency for target ${getModuleName(target.filename)} already resolved.`.white)) 
      continue;
    warn(`Parent: ` + getModuleName(targetModule.filename) + ' Child: '.white + getModuleName(target.filename));
    dependencies.add(target.filename);
    getDependencies(target, dependencies);  
  }
  return dependencies;

}

const getModuleDependencies = (targetModule) => {
  const dependencies = new Set();
  warn(`Getting module dependencies for ${getModuleName(targetModule.filename)}`.white);
  const list = getDependencies(targetModule, dependencies);
  warn(`Dependencies for module ${getModuleName(targetModule.filename)}`.white);
  list.forEach(dependency => info(getModuleName(dependency, 2)));
  return list;
}

const waitFor = async (duration) => {
    info('Waiting...');
    await new Promise((r) => setTimeout(r, duration));
};

const waitForProperty = async (object, property) => {
  while (true) {
    if (object[property]) return;
    else await waitFor(POLL_INTERVAL);
  }
};

module.exports = {
  getModuleDependencies,
  getHostName,
  getModuleLoggingMetaData,
  getModuleName,
  waitFor,
  waitForProperty
};
