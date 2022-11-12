'use strict';

const fs = require('node:fs/promises');

const { throwError } = require('../core/validation/validation');
const { error, info, getModuleLoggingMetaData } = require('../logging/logger/global-logger')(module);


/**
 * Creates a new configuration file manager class to manage ".cfg" files.
 * A ".cfg" file contains properties that may change while the app is running, making them
 * inappropriate to store in a .env file.
 * @class
 * @todo rewrite to use dotenv.parse()
 */
class ConfigurationFile {
  #file;
  #keyValueMap;
  #fileLoaded;
  constructor() {
    this.#keyValueMap = new Map();
    this.#fileLoaded = false;
  }

/**
 * Creates a new configuration file manager class.
 * @async
 * @param {string} file filepath of configration file (.cfg)
 */
  async read(file) {
    return await this.#readConfigFile(file);
  }

/**
 * Retrieves a property from the .cfg file.
 * 
 * @param {string} key property to retreive from the .cfg file
 */
  get(key) {
    return this.#keyValueMap.get(key);
  }

/**
 * Reads the contents of a property file from disk and stores the properties in a key value store
 * This is a private method, consumers should use read.
 * 
 * @private
 * @param {string} file filepath of configration file (.cfg)
 * 
 */
  async #readConfigFile(file) {
    if (this.#keyValueMap.size > 0) return;
    this.#file = file;
    info(`Reading configuration file.`);
    try {
      const data = await fs.readFile(file, 'utf-8');
      info('File contents.');
      if (data.length < 1) return; //config file exists but it is empty
      info(JSON.stringify(data, null, 2));
      data.split('\n').forEach((keyValuePair) => {
        const key = keyValuePair.split('=')[0];
        const value = keyValuePair.split('=')[1];

        const booleanFalse =
          value && isNaN(value) && value.toUpperCase().trim() === 'FALSE';
        if (key && value)
          this.#keyValueMap.set(key.trim(), !booleanFalse && value.trim());
      });
      this.#fileLoaded = true;
    } catch (e) {
        e.stack && error(e.stack);
        error('Could not read file!');
    }
  }

/**
 * Saves a ".cfg" file.
 * @async
 * 
 */
  async save() {
    if (!this.#fileLoaded) throw new Error('No configuration file loaded!');
    return await this.#writeConfigToFile();
  }

/**
 * Sets the value of a propery in the ".cfg" file.
 * @async
 * 
 * 
 */
  setValue(key, value) {
    if (!this.#fileLoaded) throw new Error('No configuration file loaded!');
    info(`Key = ${key}`);
    info(`Value = ${value}`);
    this.#keyValueMap.set(key, value);
    return this;
  }

  async #writeConfigToFile() {
    let newData = ''; //set to an empty string, otherwise the file will begin with 'undefined'
    info('Writing configuration file.');
    const json = JSON.stringify(Object.fromEntries(this.#keyValueMap), null, 2);
    try {
      const iterator1 = this.#keyValueMap[Symbol.iterator]();
      for (const keyValuePair of iterator1) {
        info('Key = ');
        info(keyValuePair[0]);
        info('Value = ');
        info(isNaN(keyValuePair[1]));
        keyValuePair[1] =
          keyValuePair[1].toString().toUpperCase() === 'FALSE'
            ? 'FALSE'
            : keyValuePair[1];
        newData += keyValuePair.join('=').concat('\n');
      }
      await fs.writeFile(this.#file, newData);
      info(`File ${this.#file} saved`);
      return true;
    } catch (e) {
      error(`${this.#file} not saved!`);
    }
  }
}

module.exports = {
  getConfigFile: (filename) => {
    const config = new ConfigurationFile();

    const getValueFromConfigFile = async (key) => {
      await config.read(filename);
      return config.get(key);
    };

    const saveValueToConfigFile = async (property, value) => {
      const saved = await config.setValue(property, value).save();
      saved
        ? info('New password written to .cfg file!')
        : throwError('New password not written to .cfg file!');
    };
    return {
      getValueFromConfigFile,
      saveValueToConfigFile
    };
  },
  getModuleLoggingMetaData
};
