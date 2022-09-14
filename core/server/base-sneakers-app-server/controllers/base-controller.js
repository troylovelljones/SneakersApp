//health check controller
const config = require('dotenv').config();
const colors = require('colors');
const os = require('os');
const registrationServerUpdate = require('./registration-server-update');
const { Console } = console;

let appConsole = new Console({colorMode: true, groupIndentation: 3,
    stdout: process.stdout, stderr: process.stderr});

const {group, groupEnd, log} = appConsole;

module.exports = {
    
    test: (req, res) => {
        group('Api healthcheck initiated.'.blue);
        log(`Free memory: ` + `${os.freemem}`.green);
        log(`Total memory: ` + `${os.totalmem()}`.green);
        log(`Uptime: ` + `${os.uptime}`.green),
        log(`Cpus: `);
        log(os.cpus());
        res.status(200).send(
            {
                message: `Server started successfully.`,
                freememory: os.freemem(),
                totalmemory: os.totalmem(),
                uptime: os.uptime(),
                cpus: os.cpus()

            });
        log('-Api health endpoint reached successfully'.green);
        groupEnd();
        log(`Api Healthcheck completed successfully.`.blue);

    },
    
    kill: (req, res) => {
        log('Kill command recieved.'.yellow);
        res.status(200).send(`Kill command initiated at ip address: ${process.env.SERVER_IP_ADDRESS}.`);
        log('Killing process'.cyan);
        groupEnd();
        process.exit();
    },

    update: (req, res) => {
        //for now we just update the location of the registration server
        log('Request received to update location of notification server.'.yellow);
        registrationServerUpdate.notify(req.url);
        res.status(200).send('Update confirmed.');
    }

}        

    