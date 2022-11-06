'use strict';

const colors = require('colors');
const { log } = require('../../../logging/logger/global-logger');
const os = require('os');

module.exports = {
  test: (req, res) => {
    log('Api healthcheck initiated.'.blue);
    log(`Free memory: ` + `${os.freemem}`.green);
    log(`Total memory: ` + `${os.totalmem()}`.green);
    log(`Uptime: ` + `${os.uptime}`.green), debug(`Cpus: `);
    log(os.cpus());
    res.status(200).send({
      message: `Server started successfully.`,
      freememory: os.freemem(),
      totalmemory: os.totalmem(),
      uptime: os.uptime(),
      cpus: os.cpus()
    });
    log('-Api health endpoint reached successfully'.green);
    log(`Api Healthcheck completed successfully.`.blue);
  },

  kill: (req, res) => {
    log('Kill command recieved.'.yellow);
    res
      .status(200)
      .send(
        `Kill command initiated at ip address: ${process.env.SERVER_IP_ADDRESS}.`
      );
    process.emit('APPTERM');
    log('Killing process'.cyan);
    process.log(process.process.pid);
  },

  update: (req, res) => {
    //for now we just update the location of the registration server
    log('Request received to update location of registration server.'.yellow);
    registrationServerUpdate.notify(req.url);
    res.status(200).send('Update confirmed.');
  }
};
