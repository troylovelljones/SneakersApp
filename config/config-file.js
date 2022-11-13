'use strict';

const fs = require('node:fs/promises');

const { throwError } = require('../core/validation/validation');
const { debug, error, getModuleLoggingMetaData } = require('../logging/logger/global-logger')(module);


/**
 * Creates a new configuration file manager class to manage ".cfg" files.
 * A ".cfg" file contains properties that may change while the app is running, making them
 * inappropriate to store in a .env file.
 * @class
 * @todo rewrite to use dotenv.parse()
 */
class ConfigurationFile {
  /**
    * @private
    * @type {string} The path where the configuration file is located.
    */
  #file;
  /**
    * @private 
    * @type {Map<string,string>} Contains the property, value pair from the configuration file.
    */
  #keyValueMap;
  /**
    * @private 
    * @type {boolean} Indicates if the configuration file has been loaded.
    */
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
 * @param {string} property The property to retreive from the .cfg file
 * @returns {string} The value of the property (key)
 */
  get(property) {
    return this.#keyValueMap.get(property);
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
    debug(`Reading configuration file.`);
    try {
      const data = await fs.readFile(file, 'utf-8');
      debug('File contents.');
      if (data.length < 1) return; //config file exists but it is empty
      debug(JSON.stringify(data, null, 2));
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
 * @returns {Promise<object>}
 */
  async save() {
    if (!this.#fileLoaded) throw new Error('No configuration file loaded!');
    return await this.#writeConfigToFile();
  }

/**
 * Sets the value of a propery in the ".cfg" file.
 * 
 * @param {string} key Index of the value to be set
 * @param {any} value Value to save to the confiuration file
 * @returns {ConfigurationFile}
 * 
 */
  setValue(key, value) {
    if (!this.#fileLoaded) throw new Error('No configuration file loaded!');
    debug(`Key = ${key}`);
    debug(`Value = ${value}`);
    this.#keyValueMap.set(key, value);
    return this;
  }

  /**
    * Writes the stored key values pairs to the .cfg file
    * @async
    * @private
    * @returns {Promise<boolean>} True is the properties were successfully writing to .cfg
    * 
    */
  async #writeConfigToFile() {
    let newData = ''; //set to an empty string, otherwise the file will begin with 'undefined'
    debug('Writing configuration file.');
    const json = JSON.stringify(Object.fromEntries(this.#keyValueMap), null, 2);
    try {
      const iterator1 = this.#keyValueMap[Symbol.iterator]();
      for (const keyValuePair of iterator1) {
        debug('Key = ');
        debug(keyValuePair[0]);
        debug('Value = ');
        //huh??
        debug(isNaN(keyValuePair[1]));
        let value = keyValuePair[1]
        value = typeof value === 'string' && value.toString().toUpperCase() === 'FALSE' ? 'FALSE' : value;
        newData += keyValuePair.join('=').concat('\n');
      }
      await fs.writeFile(this.#file, newData);
      debug(`File ${this.#file} saved`);
      return true;
    } catch (e) {
        error(`${this.#file} not saved!`);
        Object.keys(e).length > 0 && error(e);
        e.stack && error(e.stack);
    }
  }
}

module.exports = {
  /**
    * Loads the configuration file at {@link filename}
    * 
    * @param {string} filename File path of the configuration file.
    * @returns {{getValueFromConfigFile: function, saveValueToConfigFile: function}} An object containing two functions, {@link getValueFromConfigFile} and {@link saveValueToConfigFile}.
    * 
    */
  getConfigFile: (filename) => {
    const config = new ConfigurationFile();
    
    /**
      * Loads {@link key} from the configutation file
      * 
      * @param {string} key Property to be retreived from the configuration file.
      * @returns {string} The value of the property in the configuration file.
      * 
      */
    const getValueFromConfigFile = async (key) => {
      await config.read(filename);
      return config.get(key);
    };

    /**
      * Saves the {@link property} with {@link value} to the configuration file.
      * 
      * @param {string} property Name of the property to be saved to the configuration file.
      * @param {string} value Value of the property to ve saved to the configuration file.
      * @returns {boolean} Truthy if the property value was succesfully saved to the file.
      * 
      */
    const saveValueToConfigFile = async (property, value) => {
      config.setValue(property, value);
      const saved = await config.save();
      saved ? debug(`${property} written to .cfg file!`) : throwError(`${property} not written to .cfg file!`);
    };

    return {
      getValueFromConfigFile,
      saveValueToConfigFile
    };
  },
  getModuleLoggingMetaData
};
