'use strict';

const fs = require('node:fs/promises');

const { throwError } = require('../core/validation/validation');
const { error, info, getModuleLoggingMetaData } = require('../logging/logger/global-logger')(module);

//TO DO - rewrite to use dotenv.parse()

class ConfigurationFile {
  #file;
  #keyValueMap;
  #fileLoaded;
  constructor() {
    this.#keyValueMap = new Map();
    this.#fileLoaded = false;
  }

  async read(file) {
    return await this.#readConfigFile(file);
  }

  get(key) {
    return this.#keyValueMap.get(key);
  }

  async #readConfigFile(file) {
    if (this.#keyValueMap.size > 0) return;
    this.#keyValueMap.size > 0 &&
      throwError('Configuration file has already been loaded!');
    this.#file = file;
    info(`Reading configuration file.`);
    try {
      const data = await fs.readFile(file, 'utf-8');
      info('File contents.');
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
      error(JSON.stringify(e.stack, null, 2));
      error('Could not read file!');
    }
  }

  async save() {
    if (!this.#fileLoaded) throw new Error('No configuration file loaded!');
    return await this.#writeConfigToFile();
  }

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
