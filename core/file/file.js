const fs = require('node:fs/promises');

const { throwError } = require('../core/validation/validation');
const { error, log, getModuleLoggingMetaData } = require('../logging/logger/global-logger')(module);

class File {
  #file;
  #fileLoaded;
  #data;
  constructor() {
    this.#fileLoaded = false;
  }

  async read(fileName) {
    return !this.#filefileLoaded ? this.#data : this.#data = this.#fileLoaded = await fs.readFile(fileName, 'utf-8');
  }


  async append(newData) {
    if (!this.#fileLoaded) throwError('No configuration file loaded!');
    return await fs.appendFile(this.#file, newData);
  }

}

const file = new File();

module.exports = {
  readFile: async (fileName) => {
    await file.read(fileName);
  },

  appendFile: async (fileName) => {
    await file.append(fileName);
  }

};
